-- V1: tables, PostGIS extension, audit and soft-delete columns.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- btree_gist is required by V2's composite GiST index on (template_id, location);
-- without it Postgres rejects "data type text has no default operator class for access method gist".
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- attribute_type_value -----------------------------------------------------------------
CREATE TABLE attribute_type_value (
    id            TEXT PRIMARY KEY,
    version       BIGINT      NOT NULL DEFAULT 0,
    value         TEXT        NOT NULL,
    attribute_id  TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL,
    created_by    TEXT,
    last_modified TIMESTAMPTZ NOT NULL,
    modified_by   TEXT,
    deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at    TIMESTAMPTZ,
    deleted_by    TEXT
);

-- attribute ----------------------------------------------------------------------------
CREATE TABLE attribute (
    id                        TEXT PRIMARY KEY,
    version                   BIGINT      NOT NULL DEFAULT 0,
    name                      TEXT        NOT NULL,
    attribute_type            TEXT        NOT NULL,
    attribute_value_type_ids  TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at                TIMESTAMPTZ NOT NULL,
    created_by                TEXT,
    last_modified             TIMESTAMPTZ NOT NULL,
    modified_by               TEXT,
    deleted                   BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at                TIMESTAMPTZ,
    deleted_by                TEXT
);

CREATE UNIQUE INDEX uq_attribute_name_active
    ON attribute (name) WHERE deleted = false;

-- template -----------------------------------------------------------------------------
CREATE TABLE template (
    id                  TEXT PRIMARY KEY,
    version             BIGINT      NOT NULL DEFAULT 0,
    name                TEXT        NOT NULL,
    child_template_ids  TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    attribute_ids       TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at          TIMESTAMPTZ NOT NULL,
    created_by          TEXT,
    last_modified       TIMESTAMPTZ NOT NULL,
    modified_by         TEXT,
    deleted             BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    deleted_by          TEXT
);

-- intelligence -------------------------------------------------------------------------
CREATE TABLE intelligence (
    id                          TEXT PRIMARY KEY,
    version                     BIGINT      NOT NULL DEFAULT 0,
    header                      TEXT,
    description                 TEXT,
    keywords                    TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    attached_file_unique_ids    TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    location                    GEOMETRY(Geometry, 4326),
    -- related_locations stored as TEXT[] of WKT strings for MVP simplicity (no spatial index needed
    -- on this list; the primary searchable geometry is `location`).
    related_locations           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    template_id                 TEXT        NOT NULL,
    related_intelligence_ids    TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    attribute_values            JSONB       NOT NULL DEFAULT '{}'::JSONB,
    created_at                  TIMESTAMPTZ NOT NULL,
    created_by                  TEXT,
    last_modified               TIMESTAMPTZ NOT NULL,
    modified_by                 TEXT,
    deleted                     BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at                  TIMESTAMPTZ,
    deleted_by                  TEXT,

    CONSTRAINT fk_intelligence_template FOREIGN KEY (template_id) REFERENCES template(id) DEFERRABLE INITIALLY DEFERRED
);
