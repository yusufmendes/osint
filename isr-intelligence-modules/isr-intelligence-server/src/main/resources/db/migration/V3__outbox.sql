-- V3: transactional outbox for PG -> Solr sync.

CREATE TABLE intelligence_outbox (
    id            BIGSERIAL PRIMARY KEY,
    entity_type   TEXT        NOT NULL,
    entity_id     TEXT        NOT NULL,
    op            TEXT        NOT NULL CHECK (op IN ('INSERT','UPDATE','DELETE')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at  TIMESTAMPTZ,
    attempt_count INT         NOT NULL DEFAULT 0,
    last_error    TEXT
);

-- Worker scans only unprocessed rows.
CREATE INDEX idx_intelligence_outbox_unprocessed
    ON intelligence_outbox (created_at)
    WHERE processed_at IS NULL;
