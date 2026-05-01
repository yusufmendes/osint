package com.osint.intelligence.server.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.osint.intelligence.server.db.GeometryWkt;
import com.osint.intelligence.server.db.JsonbSupport;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.error.OptimisticLockException;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectJoinStep;
import org.jooq.impl.DSL;
import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static com.osint.intelligence.server.db.Tables.*;

@Repository
public class IntelligenceRepository {

    private static final Field<String> LOCATION_WKT =
            DSL.field("ST_AsText(location)", String.class).as("location_wkt");
    private static final Field<String[]> RELATED_LOCATIONS =
            DSL.field(DSL.name("intelligence", "related_locations"), String[].class);
    private static final Field<String> ATTRIBUTE_VALUES_JSON =
            DSL.field("attribute_values::text", String.class).as("attribute_values_json");

    private final DSLContext dsl;
    private final ObjectMapper mapper;

    public IntelligenceRepository(DSLContext dsl, ObjectMapper mapper) {
        this.dsl = dsl;
        this.mapper = mapper;
    }

    @Transactional
    public IntelligenceDto insert(IntelligenceDto dto, String user) {
        Instant now = Instant.now();
        AuditDto audit = AuditDto.initial(now, user);
        String json = JsonbSupport.writeJson(mapper, dto.attributeIdToAttributeValueMap());
        String locationWkt = GeometryWkt.toWkt(dto.location());
        String[] relatedWkts = relatedToWktArray(dto.relatedLocationList());

        dsl.execute(
                "INSERT INTO intelligence (" +
                        "id, version, header, description, keywords, attached_file_unique_ids, " +
                        "location, related_locations, template_id, related_intelligence_ids, " +
                        "attribute_values, created_at, created_by, last_modified, modified_by, deleted) " +
                        "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, " +
                        "  CASE WHEN {6} IS NULL THEN NULL ELSE ST_GeomFromText({6}, 4326) END, " +
                        "  {7}, {8}, {9}, {10}::jsonb, {11}, {12}, {13}, {14}, FALSE)",
                DSL.val(dto.id()),
                DSL.val(0L),
                DSL.val(dto.header()),
                DSL.val(dto.description()),
                DSL.val(toArray(dto.keywords())),
                DSL.val(toArray(dto.attachedFileUniqueIdList())),
                DSL.val(locationWkt),
                DSL.val(relatedWkts),
                DSL.val(dto.templateId()),
                DSL.val(toArray(dto.relatedIntelligenceIdList())),
                DSL.val(json),
                DSL.val(audit.createdAt()),
                DSL.val(audit.createdBy()),
                DSL.val(audit.lastModified()),
                DSL.val(audit.modifiedBy()));

        return new IntelligenceDto(
                dto.id(), 0L, dto.header(), dto.description(), dto.keywords(),
                dto.attachedFileUniqueIdList(), dto.location(), dto.relatedLocationList(),
                dto.templateId(), dto.relatedIntelligenceIdList(),
                dto.attributeIdToAttributeValueMap(), audit);
    }

    @Transactional
    public IntelligenceDto update(IntelligenceDto dto, String user) {
        Instant now = Instant.now();
        long expected = dto.version();
        String json = JsonbSupport.writeJson(mapper, dto.attributeIdToAttributeValueMap());
        String locationWkt = GeometryWkt.toWkt(dto.location());
        String[] relatedWkts = relatedToWktArray(dto.relatedLocationList());

        int affected = dsl.execute(
                "UPDATE intelligence SET " +
                        "version = {0}, header = {1}, description = {2}, keywords = {3}, " +
                        "attached_file_unique_ids = {4}, " +
                        "location = CASE WHEN {5} IS NULL THEN NULL ELSE ST_GeomFromText({5}, 4326) END, " +
                        "related_locations = {6}, template_id = {7}, related_intelligence_ids = {8}, " +
                        "attribute_values = {9}::jsonb, last_modified = {10}, modified_by = {11} " +
                        "WHERE id = {12} AND version = {13} AND deleted = FALSE",
                DSL.val(expected + 1),
                DSL.val(dto.header()),
                DSL.val(dto.description()),
                DSL.val(toArray(dto.keywords())),
                DSL.val(toArray(dto.attachedFileUniqueIdList())),
                DSL.val(locationWkt),
                DSL.val(relatedWkts),
                DSL.val(dto.templateId()),
                DSL.val(toArray(dto.relatedIntelligenceIdList())),
                DSL.val(json),
                DSL.val(now),
                DSL.val(user),
                DSL.val(dto.id()),
                DSL.val(expected));

        if (affected == 0) {
            throw new OptimisticLockException("Intelligence", dto.id(), expected);
        }
        return new IntelligenceDto(
                dto.id(), expected + 1, dto.header(), dto.description(), dto.keywords(),
                dto.attachedFileUniqueIdList(), dto.location(), dto.relatedLocationList(),
                dto.templateId(), dto.relatedIntelligenceIdList(),
                dto.attributeIdToAttributeValueMap(), dto.audit().withModification(now, user));
    }

    @Transactional
    public boolean softDelete(String id, long expectedVersion, String user) {
        Instant now = Instant.now();
        int affected = dsl.update(INTELLIGENCE)
                .set(INTELLIGENCE_VERSION, expectedVersion + 1)
                .set(INTELLIGENCE_DELETED, true)
                .set(INTELLIGENCE_DELETED_AT, now)
                .set(INTELLIGENCE_DELETED_BY, user)
                .set(INTELLIGENCE_LAST_MODIFIED, now)
                .set(INTELLIGENCE_MODIFIED_BY, user)
                .where(INTELLIGENCE_ID.eq(id))
                .and(INTELLIGENCE_VERSION.eq(expectedVersion))
                .and(INTELLIGENCE_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("Intelligence", id, expectedVersion);
        }
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<IntelligenceDto> findById(String id) {
        return baseSelect()
                .where(INTELLIGENCE_ID.eq(id))
                .fetchOptional()
                .map(this::map);
    }

    @Transactional(readOnly = true)
    public List<IntelligenceDto> findActiveByTemplate(String templateId) {
        return baseSelect()
                .where(INTELLIGENCE_TEMPLATE_ID.eq(templateId))
                .and(INTELLIGENCE_DELETED.eq(false))
                .orderBy(INTELLIGENCE_LAST_MODIFIED.desc(), INTELLIGENCE_ID.asc())
                .fetch(this::map);
    }

    @Transactional(readOnly = true)
    public List<IntelligenceDto> findByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return baseSelect()
                .where(INTELLIGENCE_ID.in(ids))
                .fetch(this::map);
    }

    /**
     * Streaming delta sync. The returned {@link Stream} owns a server-side cursor — close it.
     *
     * <ul>
     *   <li>{@code lastQueryTime == null}: rows where {@code deleted = false}.</li>
     *   <li>{@code lastQueryTime != null}: rows where {@code last_modified > lastQueryTime} (deleted included).</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    public Stream<IntelligenceDto> streamDelta(String templateId, Instant lastQueryTime) {
        Condition where = INTELLIGENCE_TEMPLATE_ID.eq(templateId);
        if (lastQueryTime == null) {
            where = where.and(INTELLIGENCE_DELETED.eq(false));
        } else {
            where = where.and(INTELLIGENCE_LAST_MODIFIED.gt(lastQueryTime));
        }
        return baseSelect()
                .where(where)
                .orderBy(INTELLIGENCE_LAST_MODIFIED.asc(), INTELLIGENCE_ID.asc())
                .fetchSize(1000)
                .fetchStream()
                .map(this::map);
    }

    private SelectJoinStep<Record> baseSelect() {
        return dsl.select(List.of(
                        INTELLIGENCE_ID,
                        INTELLIGENCE_VERSION,
                        INTELLIGENCE_HEADER,
                        INTELLIGENCE_DESCRIPTION,
                        INTELLIGENCE_KEYWORDS,
                        INTELLIGENCE_ATTACHED_FILES,
                        LOCATION_WKT,
                        RELATED_LOCATIONS,
                        INTELLIGENCE_TEMPLATE_ID,
                        INTELLIGENCE_RELATED_IDS,
                        ATTRIBUTE_VALUES_JSON,
                        INTELLIGENCE_CREATED_AT,
                        INTELLIGENCE_CREATED_BY,
                        INTELLIGENCE_LAST_MODIFIED,
                        INTELLIGENCE_MODIFIED_BY,
                        INTELLIGENCE_DELETED,
                        INTELLIGENCE_DELETED_AT,
                        INTELLIGENCE_DELETED_BY))
                .from(INTELLIGENCE);
    }

    private IntelligenceDto map(Record record) {
        Geometry location = GeometryWkt.fromWkt(record.get(LOCATION_WKT));
        String[] relatedWkts = record.get(RELATED_LOCATIONS);
        List<Geometry> relatedGeometries = relatedWkts == null
                ? List.of()
                : Arrays.stream(relatedWkts).map(GeometryWkt::fromWkt).toList();
        String[] keywords = record.get(INTELLIGENCE_KEYWORDS);
        String[] attached = record.get(INTELLIGENCE_ATTACHED_FILES);
        String[] related = record.get(INTELLIGENCE_RELATED_IDS);
        AuditDto audit = new AuditDto(
                record.get(INTELLIGENCE_CREATED_AT),
                record.get(INTELLIGENCE_CREATED_BY),
                record.get(INTELLIGENCE_LAST_MODIFIED),
                record.get(INTELLIGENCE_MODIFIED_BY),
                Boolean.TRUE.equals(record.get(INTELLIGENCE_DELETED)),
                record.get(INTELLIGENCE_DELETED_AT),
                record.get(INTELLIGENCE_DELETED_BY));
        return new IntelligenceDto(
                record.get(INTELLIGENCE_ID),
                record.get(INTELLIGENCE_VERSION),
                record.get(INTELLIGENCE_HEADER),
                record.get(INTELLIGENCE_DESCRIPTION),
                keywords == null ? List.of() : Arrays.asList(keywords),
                attached == null ? List.of() : Arrays.asList(attached),
                location,
                relatedGeometries,
                record.get(INTELLIGENCE_TEMPLATE_ID),
                related == null ? List.of() : Arrays.asList(related),
                JsonbSupport.readJson(mapper, record.get(ATTRIBUTE_VALUES_JSON)),
                audit);
    }

    private static String[] toArray(List<String> list) {
        return list == null ? new String[0] : list.toArray(new String[0]);
    }

    private static String[] relatedToWktArray(List<Geometry> geometries) {
        if (geometries == null || geometries.isEmpty()) {
            return new String[0];
        }
        return geometries.stream().map(GeometryWkt::toWkt).toArray(String[]::new);
    }
}
