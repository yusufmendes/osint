package com.osint.intelligence.server.repository;

import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.TemplateDto;
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
public class TemplateRepository {

    private final DSLContext dsl;

    public TemplateRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public TemplateDto insert(TemplateDto dto, String user) {
        Instant now = Instant.now();
        AuditDto audit = AuditDto.initial(now, user);
        dsl.insertInto(TEMPLATE)
                .set(TEMPLATE_ID, dto.id())
                .set(TEMPLATE_VERSION, 0L)
                .set(TEMPLATE_NAME, dto.name())
                .set(TEMPLATE_CHILD_IDS, toArray(dto.childTemplateIdList()))
                .set(TEMPLATE_ATTRIBUTE_IDS, toArray(dto.attributeIdList()))
                .set(TEMPLATE_CREATED_AT, audit.createdAt())
                .set(TEMPLATE_CREATED_BY, audit.createdBy())
                .set(TEMPLATE_LAST_MODIFIED, audit.lastModified())
                .set(TEMPLATE_MODIFIED_BY, audit.modifiedBy())
                .set(TEMPLATE_DELETED, false)
                .execute();
        return new TemplateDto(dto.id(), 0L, dto.name(), dto.childTemplateIdList(), dto.attributeIdList(), audit);
    }

    public TemplateDto update(TemplateDto dto, String user) {
        Instant now = Instant.now();
        long expected = dto.version();
        int affected = dsl.update(TEMPLATE)
                .set(TEMPLATE_VERSION, expected + 1)
                .set(TEMPLATE_NAME, dto.name())
                .set(TEMPLATE_CHILD_IDS, toArray(dto.childTemplateIdList()))
                .set(TEMPLATE_ATTRIBUTE_IDS, toArray(dto.attributeIdList()))
                .set(TEMPLATE_LAST_MODIFIED, now)
                .set(TEMPLATE_MODIFIED_BY, user)
                .where(TEMPLATE_ID.eq(dto.id()))
                .and(TEMPLATE_VERSION.eq(expected))
                .and(TEMPLATE_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("Template", dto.id(), expected);
        }
        return new TemplateDto(dto.id(), expected + 1, dto.name(), dto.childTemplateIdList(),
                dto.attributeIdList(), dto.audit().withModification(now, user));
    }

    public boolean softDelete(String id, long expectedVersion, String user) {
        Instant now = Instant.now();
        int affected = dsl.update(TEMPLATE)
                .set(TEMPLATE_VERSION, expectedVersion + 1)
                .set(TEMPLATE_DELETED, true)
                .set(TEMPLATE_DELETED_AT, now)
                .set(TEMPLATE_DELETED_BY, user)
                .set(TEMPLATE_LAST_MODIFIED, now)
                .set(TEMPLATE_MODIFIED_BY, user)
                .where(TEMPLATE_ID.eq(id))
                .and(TEMPLATE_VERSION.eq(expectedVersion))
                .and(TEMPLATE_DELETED.eq(false))
                .execute();
        if (affected == 0) {
            throw new OptimisticLockException("Template", id, expectedVersion);
        }
        return true;
    }

    public Optional<TemplateDto> findById(String id) {
        return dsl.selectFrom(TEMPLATE)
                .where(TEMPLATE_ID.eq(id))
                .fetchOptional()
                .map(this::map);
    }

    public List<TemplateDto> findAllActive() {
        return dsl.selectFrom(TEMPLATE)
                .where(TEMPLATE_DELETED.eq(false))
                .fetch(this::map);
    }

    private static String[] toArray(List<String> list) {
        return list == null ? new String[0] : list.toArray(new String[0]);
    }

    private TemplateDto map(Record record) {
        String[] children = record.get(TEMPLATE_CHILD_IDS);
        String[] attrs = record.get(TEMPLATE_ATTRIBUTE_IDS);
        AuditDto audit = new AuditDto(
                record.get(TEMPLATE_CREATED_AT),
                record.get(TEMPLATE_CREATED_BY),
                record.get(TEMPLATE_LAST_MODIFIED),
                record.get(TEMPLATE_MODIFIED_BY),
                Boolean.TRUE.equals(record.get(TEMPLATE_DELETED)),
                record.get(TEMPLATE_DELETED_AT),
                record.get(TEMPLATE_DELETED_BY));
        return new TemplateDto(
                record.get(TEMPLATE_ID),
                record.get(TEMPLATE_VERSION),
                record.get(TEMPLATE_NAME),
                children == null ? List.of() : Arrays.asList(children),
                attrs == null ? List.of() : Arrays.asList(attrs),
                audit);
    }
}
