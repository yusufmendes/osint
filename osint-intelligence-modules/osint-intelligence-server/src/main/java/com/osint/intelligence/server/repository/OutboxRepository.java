package com.osint.intelligence.server.repository;

import com.osint.intelligence.server.db.JdbcTimes;
import com.osint.intelligence.server.dto.OutboxEntityType;
import com.osint.intelligence.server.dto.OutboxEntry;
import com.osint.intelligence.server.dto.OutboxOp;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static com.osint.intelligence.server.db.Tables.*;

@Repository
public class OutboxRepository {

    private final DSLContext dsl;

    public OutboxRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Inserts a new outbox row in the <strong>caller's</strong> transaction (the service must be
     * {@code @Transactional} so the row commits atomically with the entity write).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(OutboxEntityType type, String entityId, OutboxOp op) {
        dsl.insertInto(OUTBOX)
                .set(OUTBOX_ENTITY_TYPE, type.name())
                .set(OUTBOX_ENTITY_ID, entityId)
                .set(OUTBOX_OP, op.name())
                .set(OUTBOX_CREATED_AT, Instant.now())
                .set(OUTBOX_ATTEMPT_COUNT, 0)
                .execute();
    }

    /**
     * Claims up to {@code batchSize} unprocessed rows under {@code FOR UPDATE SKIP LOCKED} so multiple
     * worker instances may safely run. Caller must keep the same transaction open until the rows are
     * marked processed.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public List<OutboxEntry> claimBatch(int batchSize, int maxAttempts) {
        return dsl.selectFrom(OUTBOX)
                .where(OUTBOX_PROCESSED_AT.isNull())
                .and(OUTBOX_ATTEMPT_COUNT.lt(maxAttempts))
                .orderBy(OUTBOX_CREATED_AT.asc(), OUTBOX_ID.asc())
                .limit(batchSize)
                .forUpdate()
                .skipLocked()
                .fetch(this::map);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void markProcessed(long id) {
        dsl.update(OUTBOX)
                .set(OUTBOX_PROCESSED_AT, Instant.now())
                .where(OUTBOX_ID.eq(id))
                .execute();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void markFailed(long id, String error) {
        dsl.update(OUTBOX)
                .set(OUTBOX_ATTEMPT_COUNT, OUTBOX_ATTEMPT_COUNT.plus(1))
                .set(OUTBOX_LAST_ERROR, error == null ? null : truncate(error, 4000))
                .where(OUTBOX_ID.eq(id))
                .execute();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        Long n = dsl.selectCount()
                .from(OUTBOX)
                .where(OUTBOX_PROCESSED_AT.isNull())
                .fetchOne(0, Long.class);
        return n == null ? 0L : n;
    }

    private OutboxEntry map(Record record) {
        Instant processedAt = JdbcTimes.getInstant(record, OUTBOX_PROCESSED_AT);
        Integer attempts = record.get(OUTBOX_ATTEMPT_COUNT);
        return new OutboxEntry(
                record.get(OUTBOX_ID),
                OutboxEntityType.valueOf(record.get(OUTBOX_ENTITY_TYPE)),
                record.get(OUTBOX_ENTITY_ID),
                OutboxOp.valueOf(record.get(OUTBOX_OP)),
                JdbcTimes.getInstant(record, OUTBOX_CREATED_AT),
                processedAt,
                attempts == null ? 0 : attempts,
                record.get(OUTBOX_LAST_ERROR));
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
