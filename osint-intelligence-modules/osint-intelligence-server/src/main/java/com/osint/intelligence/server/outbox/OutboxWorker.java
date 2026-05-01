package com.osint.intelligence.server.outbox;

import com.osint.intelligence.server.config.IntelligenceProperties;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.dto.OutboxEntityType;
import com.osint.intelligence.server.dto.OutboxEntry;
import com.osint.intelligence.server.dto.OutboxOp;
import com.osint.intelligence.server.repository.IntelligenceRepository;
import com.osint.intelligence.server.repository.OutboxRepository;
import com.osint.intelligence.server.service.SolrIndexer;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.common.SolrInputDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class OutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxWorker.class);

    private final OutboxRepository outboxRepository;
    private final IntelligenceRepository intelligenceRepository;
    private final SolrClient solrClient;
    private final SolrIndexer solrIndexer;
    private final IntelligenceProperties properties;

    /**
     * Self-reference resolved to the Spring-managed proxy. Required because the {@link Scheduled}
     * {@link #poll()} method calls {@link #processBatch()} which is {@link Transactional}; a direct
     * {@code this.processBatch()} call would bypass the CGLIB proxy and skip transaction setup, making
     * the {@code MANDATORY} repositories blow up.
     */
    private final OutboxWorker self;

    public OutboxWorker(
            OutboxRepository outboxRepository,
            IntelligenceRepository intelligenceRepository,
            SolrClient solrClient,
            SolrIndexer solrIndexer,
            IntelligenceProperties properties,
            @Autowired @Lazy OutboxWorker self) {
        this.outboxRepository = outboxRepository;
        this.intelligenceRepository = intelligenceRepository;
        this.solrClient = solrClient;
        this.solrIndexer = solrIndexer;
        this.properties = properties;
        this.self = self;
    }

    @Scheduled(fixedDelayString = "${intelligence.outbox.poll-millis:1000}")
    public void poll() {
        try {
            int processed = self.processBatch();
            if (processed > 0) {
                log.info("OutboxWorker processed {} entries", processed);
            }
        } catch (Exception e) {
            log.warn("OutboxWorker batch failed", e);
        }
    }

    /**
     * Runs in a single PG transaction so {@code FOR UPDATE SKIP LOCKED} keeps work disjoint between
     * concurrent worker instances. Solr writes happen inside the same transaction window; Solr commit is
     * issued at the end so any failure rolls back the PG-side {@code processed_at} stamping.
     */
    @Transactional
    public int processBatch() {
        List<OutboxEntry> batch = outboxRepository.claimBatch(
                properties.getOutbox().getBatchSize(),
                properties.getOutbox().getMaxAttempts());
        if (batch.isEmpty()) {
            return 0;
        }
        List<SolrInputDocument> upserts = new ArrayList<>();
        List<String> deletes = new ArrayList<>();
        List<Long> succeededIds = new ArrayList<>();
        for (OutboxEntry entry : batch) {
            try {
                if (entry.entityType() != OutboxEntityType.INTELLIGENCE) {
                    outboxRepository.markProcessed(entry.id());
                    continue;
                }
                if (entry.op() == OutboxOp.DELETE) {
                    deletes.add(entry.entityId());
                } else {
                    Optional<IntelligenceDto> reloaded = intelligenceRepository.findById(entry.entityId());
                    if (reloaded.isEmpty() || reloaded.get().audit().deleted()) {
                        deletes.add(entry.entityId());
                    } else {
                        upserts.add(solrIndexer.toSolrDocument(reloaded.get()));
                    }
                }
                succeededIds.add(entry.id());
            } catch (Exception e) {
                log.warn("Outbox entry {} failed: {}", entry.id(), e.toString());
                outboxRepository.markFailed(entry.id(), e.getMessage());
            }
        }

        try {
            if (!upserts.isEmpty()) {
                solrClient.add(upserts);
            }
            if (!deletes.isEmpty()) {
                solrClient.deleteById(deletes);
            }
            if (!upserts.isEmpty() || !deletes.isEmpty()) {
                solrClient.commit();
            }
        } catch (Exception e) {
            log.error("Solr write failure; rolling back batch", e);
            for (Long id : succeededIds) {
                outboxRepository.markFailed(id, e.getMessage());
            }
            return 0;
        }

        for (Long id : succeededIds) {
            outboxRepository.markProcessed(id);
        }
        return succeededIds.size();
    }
}
