package com.osint.intelligence.server;

import com.osint.intelligence.model.AttributeType;
import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.dto.TemplateDto;
import com.osint.intelligence.server.outbox.OutboxWorker;
import com.osint.intelligence.server.repository.AttributeRepository;
import com.osint.intelligence.server.repository.AttributeTypeValueRepository;
import com.osint.intelligence.server.repository.OutboxRepository;
import com.osint.intelligence.server.repository.TemplateRepository;
import com.osint.intelligence.server.service.AttributeCacheService;
import com.osint.intelligence.server.service.IntelligenceService;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.common.SolrInputDocument;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;

@SpringBootTest
class OutboxWorkerIT extends AbstractPostgisIT {

    @TestConfiguration
    static class Mocks {
        @Bean
        @Primary
        SolrClient solrClient() {
            return Mockito.mock(SolrClient.class);
        }
    }

    @Autowired SolrClient solrClient;
    @Autowired IntelligenceService intelligenceService;
    @Autowired OutboxWorker outboxWorker;
    @Autowired OutboxRepository outboxRepository;
    @Autowired TemplateRepository templateRepository;
    @Autowired AttributeRepository attributeRepository;
    @Autowired AttributeTypeValueRepository valueRepository;
    @Autowired AttributeCacheService cache;

    @Test
    void worker_translates_id_keys_to_name_keys_and_writes_to_solr() throws Exception {
        Mockito.reset(solrClient);

        AttributeDto gender = attributeRepository.insert(new AttributeDto(
                UUID.randomUUID().toString(), 0L, "gender", AttributeType.ENUM, List.of(),
                AuditDto.initial(Instant.EPOCH, null)), "tester");
        AttributeTypeValueDto female = valueRepository.insert(new AttributeTypeValueDto(
                UUID.randomUUID().toString(), 0L, "FEMALE", gender.id(),
                AuditDto.initial(Instant.EPOCH, null)), "tester");
        cache.invalidateAttributes();
        cache.invalidateValues();

        TemplateDto template = templateRepository.insert(new TemplateDto(
                UUID.randomUUID().toString(), 0L, "person", List.of(), List.of(gender.id()),
                AuditDto.initial(Instant.EPOCH, null)), "tester");

        Map<String, Object> attrs = new HashMap<>();
        attrs.put(gender.id(), female.id());
        IntelligenceDto seed = new IntelligenceDto(
                UUID.randomUUID().toString(), 0L, "h", null, List.of(), List.of(), null, List.of(),
                template.id(), List.of(), attrs, AuditDto.initial(Instant.EPOCH, null));
        intelligenceService.create(seed, "tester");

        assertThat(outboxRepository.pendingCount()).isEqualTo(1L);

        int processed = outboxWorker.processBatch();
        assertThat(processed).isEqualTo(1);

        ArgumentCaptor<Collection<SolrInputDocument>> captor = ArgumentCaptor.captor();
        Mockito.verify(solrClient).add(anyCollection());
        Mockito.verify(solrClient).commit();
        Mockito.verify(solrClient).add(captor.capture());
        SolrInputDocument doc = captor.getValue().iterator().next();
        assertThat(doc.getFieldValue("templateId")).isEqualTo(template.id());
        assertThat(doc.getFieldValue("gender_s")).isEqualTo("FEMALE");

        assertThat(outboxRepository.pendingCount()).isEqualTo(0L);
    }

    @Test
    void delete_op_routes_to_solr_delete() throws Exception {
        Mockito.reset(solrClient);
        TemplateDto template = templateRepository.insert(new TemplateDto(
                UUID.randomUUID().toString(), 0L, "person", List.of(), List.of(),
                AuditDto.initial(Instant.EPOCH, null)), "tester");
        IntelligenceDto saved = intelligenceService.create(new IntelligenceDto(
                UUID.randomUUID().toString(), 0L, "h", null, List.of(), List.of(), null, List.of(),
                template.id(), List.of(), Map.of(), AuditDto.initial(Instant.EPOCH, null)), "tester");
        outboxWorker.processBatch();
        Mockito.reset(solrClient);

        intelligenceService.softDelete(saved.id(), saved.version(), "tester");
        outboxWorker.processBatch();

        Mockito.verify(solrClient).deleteById(any(List.class));
        Mockito.verify(solrClient).commit();
    }
}
