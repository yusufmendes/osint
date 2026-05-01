package com.osint.intelligence.server.repository;

import com.osint.intelligence.model.AttributeType;
import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.error.OptimisticLockException;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static com.osint.intelligence.server.db.Tables.*;

@Repository
public class AttributeRepository {

    private final DSLContext dsl;

    public AttributeRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public AttributeDto insert(AttributeDto dto, String user) {
        Instant now = Instant.now();
        AuditDto audit = AuditDto.initial(now, user);
        dsl.insertInto(ATTRIBUTE)
                .set(ATTRIBUTE_ID, dto.id())
                .set(ATTRIBUTE_VERSION, 0L)
                .set(ATTRIBUTE_NAME, dto.name())
                .set(ATTRIBUTE_TYPE, dto.attributeType().name())
                .set(ATTRIBUTE_VALUE_TYPE_IDS, toArray(dto.attributeValueTypeIdList()))
                .set(ATTRIBUTE_CREATED_AT, audit.createdAt())
                .set(ATTRIBUTE_CREATED_BY, audit.createdBy())
                .set(ATTRIBUTE_LAST_MODIFIED, audit.lastModified())
                .set(ATTRIBUTE_MODIFIED_BY, audit.modifiedBy())
                .set(ATTRIBUTE_DELETED, false)
                .execute();
        return new AttributeDto(dto.id(), 0L, dto.name(), dto.attributeType(), dto.attributeValueTypeIdList(), audit);
    }

    public AttributeDto update(AttributeDto dto, String user) {
        Instant now = Instant.now();
        long expected = dto.version();
        int affected = dsl.update(ATTRIBUTE)
                .set(ATTRIBUTE_VERSION, expected + 1)
                .set(ATTRIBUTE_NAME, dto.name())
                .set(ATTRIBUTE_TYPE, dto.attributeType().name())
                .set(ATTRIBUTE_VALUE_TYPE_IDS, toArray(dto.attributeValueTypeIdList()))
                .set(ATTRIBUTE_LAST_MODIFIED, now)
                .set(ATTRIBUTE_MODIFIED_BY, user)
                .where(ATTRIBUTE_ID.eq(dto.id()))
                .and(ATTRIBUTE_VERSION.eq(expected))
                .and(ATTRIBUTE_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("Attribute", dto.id(), expected);
        }
        return new AttributeDto(dto.id(), expected + 1, dto.name(), dto.attributeType(),
                dto.attributeValueTypeIdList(), dto.audit().withModification(now, user));
    }

    public boolean softDelete(String id, long expectedVersion, String user) {
        Instant now = Instant.now();
        int affected = dsl.update(ATTRIBUTE)
                .set(ATTRIBUTE_VERSION, expectedVersion + 1)
                .set(ATTRIBUTE_DELETED, true)
                .set(ATTRIBUTE_DELETED_AT, now)
                .set(ATTRIBUTE_DELETED_BY, user)
                .set(ATTRIBUTE_LAST_MODIFIED, now)
                .set(ATTRIBUTE_MODIFIED_BY, user)
                .where(ATTRIBUTE_ID.eq(id))
                .and(ATTRIBUTE_VERSION.eq(expectedVersion))
                .and(ATTRIBUTE_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("Attribute", id, expectedVersion);
        }
        return true;
    }

    public Optional<AttributeDto> findById(String id) {
        return dsl.selectFrom(ATTRIBUTE)
                .where(ATTRIBUTE_ID.eq(id))
                .fetchOptional()
                .map(this::map);
    }

    public List<AttributeDto> findAllActive() {
        return dsl.selectFrom(ATTRIBUTE)
                .where(ATTRIBUTE_DELETED.eq(false))
                .fetch(this::map);
    }

    private static String[] toArray(List<String> list) {
        return list == null ? new String[0] : list.toArray(new String[0]);
    }

    private AttributeDto map(Record record) {
        String[] vals = record.get(ATTRIBUTE_VALUE_TYPE_IDS);
        AuditDto audit = new AuditDto(
                record.get(ATTRIBUTE_CREATED_AT),
                record.get(ATTRIBUTE_CREATED_BY),
                record.get(ATTRIBUTE_LAST_MODIFIED),
                record.get(ATTRIBUTE_MODIFIED_BY),
                Boolean.TRUE.equals(record.get(ATTRIBUTE_DELETED)),
                record.get(ATTRIBUTE_DELETED_AT),
                record.get(ATTRIBUTE_DELETED_BY));
        return new AttributeDto(
                record.get(ATTRIBUTE_ID),
                record.get(ATTRIBUTE_VERSION),
                record.get(ATTRIBUTE_NAME),
                AttributeType.valueOf(record.get(ATTRIBUTE_TYPE)),
                vals == null ? List.of() : Arrays.asList(vals),
                audit);
    }
}
