package com.osint.intelligence.server.db;

import org.jooq.Field;
import org.jooq.Record;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Coerces JDBC timestamp values into {@link Instant}.
 *
 * <p>Postgres' JDBC driver returns {@link OffsetDateTime} for {@code timestamp with time zone}
 * columns. Our hand-written {@link Tables} class declares those columns as {@code Field<Instant>},
 * but jOOQ's {@code record.get(Field<Instant>)} on a generic {@code selectFrom(Table<?>)} record
 * does not invoke the field's {@code Converter} — it just unsafely casts to {@code Instant} and
 * blows up at the call site. Repository {@code map(...)} methods use this helper to read the raw
 * column value and normalize it to {@link Instant}.
 */
public final class JdbcTimes {

    private JdbcTimes() {}

    public static Instant getInstant(Record record, Field<Instant> field) {
        return toInstant(record.get(field.getName()));
    }

    public static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant i) {
            return i;
        }
        if (value instanceof OffsetDateTime odt) {
            return odt.toInstant();
        }
        if (value instanceof Timestamp ts) {
            return ts.toInstant();
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.toInstant(ZoneOffset.UTC);
        }
        throw new IllegalArgumentException(
                "Unsupported timestamp value type: " + value.getClass().getName());
    }
}
