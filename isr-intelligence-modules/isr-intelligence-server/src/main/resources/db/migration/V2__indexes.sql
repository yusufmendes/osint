-- V2: indexes per Initial Implementation.md section 7.4.

-- 1. GiST: every spatial query (ST_Contains, ST_DWithin, ST_Intersects).
CREATE INDEX idx_intelligence_location
    ON intelligence USING GIST (location);

-- 2. Composite GiST: template + geometry for template-scoped geo queries.
CREATE INDEX idx_intelligence_template_location
    ON intelligence USING GIST (template_id, location);

-- 3. BRIN on last_modified: heart of delta sync; small, append-friendly.
CREATE INDEX idx_intelligence_last_modified_brin
    ON intelligence USING BRIN (last_modified) WITH (pages_per_range = 128);

-- 4. (template_id, last_modified): delta sync + template filter together.
CREATE INDEX idx_intelligence_template_last_modified
    ON intelligence (template_id, last_modified);

-- 5. Partial index over active rows.
CREATE INDEX idx_intelligence_active
    ON intelligence (template_id, last_modified)
    WHERE deleted = false;

-- 6. JSONB GIN: dynamic attribute filters such as `attribute_values ->> 'gender' = 'FEMALE'`.
CREATE INDEX idx_intelligence_attribute_values_gin
    ON intelligence USING GIN (attribute_values);

-- Auxiliary indexes for the small ref tables -----------------------------------------------
CREATE INDEX idx_template_last_modified
    ON template (last_modified)
    WHERE deleted = false;

CREATE INDEX idx_attribute_last_modified
    ON attribute (last_modified)
    WHERE deleted = false;

CREATE INDEX idx_attribute_type_value_attribute_id
    ON attribute_type_value (attribute_id)
    WHERE deleted = false;
