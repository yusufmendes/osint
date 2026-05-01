package com.osint.intelligence.server.db;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jooq.Field;
import org.jooq.impl.DSL;

import java.util.Collections;
import java.util.Map;

/**
 * Helpers to read/write {@code Map<String, Object>} from a Postgres {@code JSONB} column via Jackson.
 *
 * <p>Reads are done by {@code SELECT (col)::TEXT}; writes use the SQL fragment {@code {0}::JSONB} so the
 * driver passes a {@link String}.</p>
 */
public final class JsonbSupport {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private JsonbSupport() {}

    public static Map<String, Object> readJson(ObjectMapper mapper, String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return mapper.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse JSONB payload", e);
        }
    }

    public static String writeJson(ObjectMapper mapper, Map<String, Object> map) {
        try {
            return mapper.writeValueAsString(map == null ? Collections.emptyMap() : map);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialise JSONB payload", e);
        }
    }

    /**
     * SQL field expression for a JSONB literal that binds a {@link String} parameter and casts it to JSONB.
     */
    public static Field<Object> jsonbParam(String json) {
        return DSL.field("{0}::jsonb", Object.class, DSL.val(json));
    }
}
