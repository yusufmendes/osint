package com.osint.intelligence.server.repository;

import com.osint.intelligence.server.db.JdbcTimes;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.error.OptimisticLockException;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.osint.intelligence.server.db.Tables.*;

@Repository
public class AttributeTypeValueRepository {

    private final DSLContext dsl;

    public AttributeTypeValueRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public AttributeTypeValueDto insert(AttributeTypeValueDto dto, String user) {
        Instant now = Instant.now();
        AuditDto audit = AuditDto.initial(now, user);
        dsl.insertInto(ATTRIBUTE_TYPE_VALUE)
                .set(ATV_ID, dto.id())
                .set(ATV_VERSION, 0L)
                .set(ATV_VALUE, dto.value())
                .set(ATV_ATTRIBUTE_ID, dto.attributeId())
                .set(ATV_CREATED_AT, audit.createdAt())
                .set(ATV_CREATED_BY, audit.createdBy())
                .set(ATV_LAST_MODIFIED, audit.lastModified())
                .set(ATV_MODIFIED_BY, audit.modifiedBy())
                .set(ATV_DELETED, false)
                .execute();
        return new AttributeTypeValueDto(dto.id(), 0L, dto.value(), dto.attributeId(), audit);
    }

    public AttributeTypeValueDto update(AttributeTypeValueDto dto, String user) {
        Instant now = Instant.now();
        long expected = dto.version();
        int affected = dsl.update(ATTRIBUTE_TYPE_VALUE)
                .set(ATV_VERSION, expected + 1)
                .set(ATV_VALUE, dto.value())
                .set(ATV_ATTRIBUTE_ID, dto.attributeId())
                .set(ATV_LAST_MODIFIED, now)
                .set(ATV_MODIFIED_BY, user)
                .where(ATV_ID.eq(dto.id()))
                .and(ATV_VERSION.eq(expected))
                .and(ATV_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("AttributeTypeValue", dto.id(), expected);
        }
        AuditDto audit = dto.audit().withModification(now, user);
        return new AttributeTypeValueDto(dto.id(), expected + 1, dto.value(), dto.attributeId(), audit);
    }

    public boolean softDelete(String id, long expectedVersion, String user) {
        Instant now = Instant.now();
        int affected = dsl.update(ATTRIBUTE_TYPE_VALUE)
                .set(ATV_VERSION, expectedVersion + 1)
                .set(ATV_DELETED, true)
                .set(ATV_DELETED_AT, now)
                .set(ATV_DELETED_BY, user)
                .set(ATV_LAST_MODIFIED, now)
                .set(ATV_MODIFIED_BY, user)
                .where(ATV_ID.eq(id))
                .and(ATV_VERSION.eq(expectedVersion))
                .and(ATV_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("AttributeTypeValue", id, expectedVersion);
        }
        return true;
    }

    public Optional<AttributeTypeValueDto> findById(String id) {
        return dsl.selectFrom(ATTRIBUTE_TYPE_VALUE)
                .where(ATV_ID.eq(id))
                .fetchOptional()
                .map(this::map);
    }

    public List<AttributeTypeValueDto> findByAttributeId(String attributeId) {
        return dsl.selectFrom(ATTRIBUTE_TYPE_VALUE)
                .where(ATV_ATTRIBUTE_ID.eq(attributeId))
                .and(ATV_DELETED.eq(false))
                .fetch(this::map);
    }

    public List<AttributeTypeValueDto> findAllActive() {
        return dsl.selectFrom(ATTRIBUTE_TYPE_VALUE)
                .where(ATV_DELETED.eq(false))
                .fetch(this::map);
    }

    private AttributeTypeValueDto map(Record record) {
        AuditDto audit = new AuditDto(
                JdbcTimes.getInstant(record, ATV_CREATED_AT),
                record.get(ATV_CREATED_BY),
                JdbcTimes.getInstant(record, ATV_LAST_MODIFIED),
                record.get(ATV_MODIFIED_BY),
                Boolean.TRUE.equals(record.get(ATV_DELETED)),
                JdbcTimes.getInstant(record, ATV_DELETED_AT),
                record.get(ATV_DELETED_BY));
        return new AttributeTypeValueDto(
                record.get(ATV_ID),
                record.get(ATV_VERSION),
                record.get(ATV_VALUE),
                record.get(ATV_ATTRIBUTE_ID),
                audit);
    }
}
