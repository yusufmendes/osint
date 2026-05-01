package com.osint.intelligence.server;

import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.dto.TemplateDto;
import com.osint.intelligence.server.error.OptimisticLockException;
import com.osint.intelligence.server.repository.IntelligenceRepository;
import com.osint.intelligence.server.repository.TemplateRepository;
import org.apache.solr.client.solrj.SolrClient;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class IntelligenceRepositoryIT extends AbstractPostgisIT {

    @TestConfiguration
    static class Mocks {
        @Bean
        @Primary
        SolrClient solrClient() {
            return Mockito.mock(SolrClient.class);
        }
    }

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Autowired
    IntelligenceRepository intelligenceRepository;

    @Autowired
    TemplateRepository templateRepository;

    @Test
    void crud_with_jsonb_and_geometry_roundtrips() {
        TemplateDto template = templateRepository.insert(
                new TemplateDto(UUID.randomUUID().toString(), 0L, "person", List.of(), List.of(),
                        AuditDto.initial(Instant.EPOCH, null)),
                "tester");

        Point point = GF.createPoint(new Coordinate(28.9784, 41.0082));
        IntelligenceDto seed = new IntelligenceDto(
                UUID.randomUUID().toString(), 0L, "Header", "Description",
                List.of("kw1", "kw2"), List.of("file1"),
                point, List.of(point),
                template.id(), List.of(),
                Map.of("genderAttributeId", "femaleId", "weightAttributeId", 25),
                AuditDto.initial(Instant.EPOCH, null));

        IntelligenceDto saved = intelligenceRepository.insert(seed, "tester");
        assertThat(saved.version()).isEqualTo(0L);

        IntelligenceDto fetched = intelligenceRepository.findById(saved.id()).orElseThrow();
        assertThat(fetched.header()).isEqualTo("Header");
        assertThat(fetched.keywords()).containsExactly("kw1", "kw2");
        assertThat(fetched.location()).isNotNull();
        assertThat(fetched.location().getCoordinate().x).isEqualTo(28.9784);
        assertThat(fetched.attributeIdToAttributeValueMap()).containsEntry("genderAttributeId", "femaleId");
    }

    @Test
    void update_with_stale_version_throws() {
        TemplateDto template = templateRepository.insert(
                new TemplateDto(UUID.randomUUID().toString(), 0L, "person", List.of(), List.of(),
                        AuditDto.initial(Instant.EPOCH, null)),
                "tester");
        IntelligenceDto seed = new IntelligenceDto(
                UUID.randomUUID().toString(), 0L, "Header", null,
                List.of(), List.of(), null, List.of(), template.id(), List.of(),
                Map.of(), AuditDto.initial(Instant.EPOCH, null));
        IntelligenceDto saved = intelligenceRepository.insert(seed, "tester");

        intelligenceRepository.update(saved, "tester");

        assertThatThrownBy(() -> intelligenceRepository.update(saved, "tester"))
                .isInstanceOf(OptimisticLockException.class);
    }

    @Test
    void delta_sync_filters_by_last_modified() throws Exception {
        TemplateDto template = templateRepository.insert(
                new TemplateDto(UUID.randomUUID().toString(), 0L, "person", List.of(), List.of(),
                        AuditDto.initial(Instant.EPOCH, null)),
                "tester");
        Instant before = Instant.now().minusSeconds(60);
        intelligenceRepository.insert(new IntelligenceDto(
                UUID.randomUUID().toString(), 0L, "h1", null, List.of(), List.of(), null, List.of(),
                template.id(), List.of(), Map.of(), AuditDto.initial(Instant.EPOCH, null)), "tester");

        try (Stream<IntelligenceDto> stream = intelligenceRepository.streamDelta(template.id(), before)) {
            assertThat(stream.toList()).hasSizeGreaterThanOrEqualTo(1);
        }
        try (Stream<IntelligenceDto> stream = intelligenceRepository.streamDelta(template.id(), Instant.now().plusSeconds(3600))) {
            assertThat(stream.toList()).isEmpty();
        }
    }
}
