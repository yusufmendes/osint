package com.osint.intelligence.server.service;

import com.osint.intelligence.model.AttributeType;
import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import org.apache.solr.common.SolrInputDocument;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit-level coverage for the id-keyed -> name-keyed Solr translation.
 *
 * <p>Does not require Docker.</p>
 */
class SolrIndexerTest {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Test
    void translates_enum_id_to_name_value() {
        AttributeCacheService cache = mock(AttributeCacheService.class);
        AttributeDto gender = new AttributeDto("genderId", 0L, "gender", AttributeType.ENUM,
                List.of("femaleId"), AuditDto.initial(Instant.EPOCH, null));
        AttributeTypeValueDto female = new AttributeTypeValueDto("femaleId", 0L, "FEMALE", "genderId",
                AuditDto.initial(Instant.EPOCH, null));
        when(cache.attribute("genderId")).thenReturn(gender);
        when(cache.value("femaleId")).thenReturn(female);

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("genderId", "femaleId");

        IntelligenceDto dto = new IntelligenceDto(
                "intel-1", 0L, "header", null, List.of(), List.of(), null, List.of(),
                "templateId", List.of(), attrs, AuditDto.initial(Instant.now(), "tester"));

        SolrInputDocument doc = new SolrIndexer(cache).toSolrDocument(dto);

        assertThat(doc.getFieldValue("id")).isEqualTo("intel-1");
        assertThat(doc.getFieldValue("templateId")).isEqualTo("templateId");
        assertThat(doc.getFieldValue("gender_s")).isEqualTo("FEMALE");
    }

    @Test
    void primitive_attributes_pass_through_with_correct_suffix() {
        AttributeCacheService cache = mock(AttributeCacheService.class);
        when(cache.attribute("weightId")).thenReturn(new AttributeDto(
                "weightId", 0L, "weight", AttributeType.NUMBER, List.of(),
                AuditDto.initial(Instant.EPOCH, null)));
        when(cache.attribute("activeId")).thenReturn(new AttributeDto(
                "activeId", 0L, "active", AttributeType.BOOLEAN, List.of(),
                AuditDto.initial(Instant.EPOCH, null)));

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("weightId", 75);
        attrs.put("activeId", true);

        IntelligenceDto dto = new IntelligenceDto(
                "intel-1", 0L, null, null, List.of(), List.of(), null, List.of(),
                "templateId", List.of(), attrs, AuditDto.initial(Instant.now(), null));

        SolrInputDocument doc = new SolrIndexer(cache).toSolrDocument(dto);
        assertThat(doc.getFieldValue("weight_l")).isEqualTo(75);
        assertThat(doc.getFieldValue("active_b")).isEqualTo(true);
    }

    @Test
    void enum_list_translates_each_id_via_cache() {
        AttributeCacheService cache = mock(AttributeCacheService.class);
        AttributeDto tagsAttr = new AttributeDto("tagsId", 0L, "tags", AttributeType.ENUM_LIST,
                List.of("redId", "blueId"), AuditDto.initial(Instant.EPOCH, null));
        when(cache.attribute("tagsId")).thenReturn(tagsAttr);
        when(cache.value("redId")).thenReturn(new AttributeTypeValueDto("redId", 0L, "RED", "tagsId",
                AuditDto.initial(Instant.EPOCH, null)));
        when(cache.value("blueId")).thenReturn(new AttributeTypeValueDto("blueId", 0L, "BLUE", "tagsId",
                AuditDto.initial(Instant.EPOCH, null)));

        Map<String, Object> attrs = new HashMap<>();
        attrs.put("tagsId", List.of("redId", "blueId"));

        IntelligenceDto dto = new IntelligenceDto(
                "intel-1", 0L, null, null, List.of(), List.of(), null, List.of(),
                "templateId", List.of(), attrs, AuditDto.initial(Instant.now(), null));

        SolrInputDocument doc = new SolrIndexer(cache).toSolrDocument(dto);
        assertThat(doc.getFieldValues("tags_ss")).containsExactly("RED", "BLUE");
    }

    @Test
    void location_serialises_as_lat_lon_for_solr_rpt() {
        AttributeCacheService cache = mock(AttributeCacheService.class);
        Point p = GF.createPoint(new Coordinate(28.9784, 41.0082));
        IntelligenceDto dto = new IntelligenceDto(
                "intel-1", 0L, null, null, List.of(), List.of(), p, List.of(),
                "templateId", List.of(), Map.of(), AuditDto.initial(Instant.now(), null));

        SolrInputDocument doc = new SolrIndexer(cache).toSolrDocument(dto);
        assertThat(doc.getFieldValue("location")).isEqualTo("41.0082,28.9784");
    }
}
