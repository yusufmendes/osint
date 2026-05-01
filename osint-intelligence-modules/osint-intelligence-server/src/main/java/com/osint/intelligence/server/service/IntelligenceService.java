package com.osint.intelligence.server.service;

import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.dto.OutboxEntityType;
import com.osint.intelligence.server.dto.OutboxOp;
import com.osint.intelligence.server.error.EntityNotFoundException;
import com.osint.intelligence.server.repository.IntelligenceRepository;
import com.osint.intelligence.server.repository.OutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Orchestrates writes to {@code intelligence} plus {@code intelligence_outbox} in a single transaction so
 * the row and the sync signal commit atomically. Reads stream from PG via jOOQ.
 */
@Service
public class IntelligenceService {

    private final IntelligenceRepository intelligenceRepository;
    private final OutboxRepository outboxRepository;

    public IntelligenceService(
            IntelligenceRepository intelligenceRepository,
            OutboxRepository outboxRepository) {
        this.intelligenceRepository = intelligenceRepository;
        this.outboxRepository = outboxRepository;
    }

    @Transactional
    public IntelligenceDto create(IntelligenceDto dto, String user) {
        IntelligenceDto saved = intelligenceRepository.insert(dto, user);
        outboxRepository.enqueue(OutboxEntityType.INTELLIGENCE, saved.id(), OutboxOp.INSERT);
        return saved;
    }

    @Transactional
    public IntelligenceDto update(IntelligenceDto dto, String user) {
        IntelligenceDto saved = intelligenceRepository.update(dto, user);
        outboxRepository.enqueue(OutboxEntityType.INTELLIGENCE, saved.id(), OutboxOp.UPDATE);
        return saved;
    }

    @Transactional
    public void softDelete(String id, long expectedVersion, String user) {
        intelligenceRepository.softDelete(id, expectedVersion, user);
        outboxRepository.enqueue(OutboxEntityType.INTELLIGENCE, id, OutboxOp.DELETE);
    }

    @Transactional(readOnly = true)
    public IntelligenceDto requireById(String id) {
        return findById(id).orElseThrow(() -> new EntityNotFoundException("Intelligence", id));
    }

    @Transactional(readOnly = true)
    public Optional<IntelligenceDto> findById(String id) {
        return intelligenceRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<IntelligenceDto> findActiveByTemplate(String templateId) {
        return intelligenceRepository.findActiveByTemplate(templateId);
    }

    @Transactional(readOnly = true)
    public List<IntelligenceDto> findByIds(List<String> ids) {
        return intelligenceRepository.findByIds(ids);
    }

    /**
     * Streaming delta sync — close the returned stream within the transaction.
     */
    @Transactional(readOnly = true)
    public Stream<IntelligenceDto> streamDelta(String templateId, Instant lastQueryTime) {
        return intelligenceRepository.streamDelta(templateId, lastQueryTime);
    }
}
