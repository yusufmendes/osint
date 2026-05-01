package com.osint.intelligence.server.db;

import org.jooq.Converter;
import org.jooq.DataType;
import org.jooq.Field;
import org.jooq.Name;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.jooq.impl.SQLDataType;
import org.locationtech.jts.geom.Geometry;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * Hand-written jOOQ table/field references for the intelligence schema.
 *
 * <p>This module ships <strong>without</strong> running jOOQ codegen by default so the build does not
 * require a live Postgres. When you have a database, run {@code mvn -Pjooq-codegen generate-sources}
 * and switch repositories to the generated {@code com.osint.intelligence.db.generated.Tables} — the
 * field names below intentionally match the generated ones.</p>
 */
public final class Tables {

    private Tables() {}

    // --- intelligence ---------------------------------------------------------------------

    public static final Table<?> INTELLIGENCE = DSL.table(DSL.name("intelligence"));

    public static final Field<String> INTELLIGENCE_ID = field(INTELLIGENCE, "id", String.class);
    public static final Field<Long> INTELLIGENCE_VERSION = field(INTELLIGENCE, "version", Long.class);
    public static final Field<String> INTELLIGENCE_HEADER = field(INTELLIGENCE, "header", String.class);
    public static final Field<String> INTELLIGENCE_DESCRIPTION = field(INTELLIGENCE, "description", String.class);
    public static final Field<String[]> INTELLIGENCE_KEYWORDS = field(INTELLIGENCE, "keywords", String[].class);
    public static final Field<String[]> INTELLIGENCE_ATTACHED_FILES = field(INTELLIGENCE, "attached_file_unique_ids", String[].class);
    /**
     * PostGIS {@code geometry} column type, mapped via {@link JtsGeometryBinding}. The hand-written
     * Tables class skips jOOQ codegen, so we need to attach the binding manually instead of relying
     * on a {@code <forcedType>} entry in the codegen profile.
     */
    public static final DataType<Geometry> GEOMETRY_TYPE =
            SQLDataType.OTHER.asConvertedDataType(new JtsGeometryBinding());

    public static final Field<Geometry> INTELLIGENCE_LOCATION = DSL.field(DSL.name("intelligence", "location"), GEOMETRY_TYPE);
    public static final Field<String> INTELLIGENCE_TEMPLATE_ID = field(INTELLIGENCE, "template_id", String.class);
    public static final Field<String[]> INTELLIGENCE_RELATED_IDS = field(INTELLIGENCE, "related_intelligence_ids", String[].class);
    public static final Field<String> INTELLIGENCE_ATTRIBUTE_VALUES = field(INTELLIGENCE, "attribute_values", String.class); // JSONB read as string
    public static final Field<Instant> INTELLIGENCE_CREATED_AT = field(INTELLIGENCE, "created_at", Instant.class);
    public static final Field<String> INTELLIGENCE_CREATED_BY = field(INTELLIGENCE, "created_by", String.class);
    public static final Field<Instant> INTELLIGENCE_LAST_MODIFIED = field(INTELLIGENCE, "last_modified", Instant.class);
    public static final Field<String> INTELLIGENCE_MODIFIED_BY = field(INTELLIGENCE, "modified_by", String.class);
    public static final Field<Boolean> INTELLIGENCE_DELETED = field(INTELLIGENCE, "deleted", Boolean.class);
    public static final Field<Instant> INTELLIGENCE_DELETED_AT = field(INTELLIGENCE, "deleted_at", Instant.class);
    public static final Field<String> INTELLIGENCE_DELETED_BY = field(INTELLIGENCE, "deleted_by", String.class);

    // --- template -------------------------------------------------------------------------

    public static final Table<?> TEMPLATE = DSL.table(DSL.name("template"));
    public static final Field<String> TEMPLATE_ID = field(TEMPLATE, "id", String.class);
    public static final Field<Long> TEMPLATE_VERSION = field(TEMPLATE, "version", Long.class);
    public static final Field<String> TEMPLATE_NAME = field(TEMPLATE, "name", String.class);
    public static final Field<String[]> TEMPLATE_CHILD_IDS = field(TEMPLATE, "child_template_ids", String[].class);
    public static final Field<String[]> TEMPLATE_ATTRIBUTE_IDS = field(TEMPLATE, "attribute_ids", String[].class);
    public static final Field<Instant> TEMPLATE_CREATED_AT = field(TEMPLATE, "created_at", Instant.class);
    public static final Field<String> TEMPLATE_CREATED_BY = field(TEMPLATE, "created_by", String.class);
    public static final Field<Instant> TEMPLATE_LAST_MODIFIED = field(TEMPLATE, "last_modified", Instant.class);
    public static final Field<String> TEMPLATE_MODIFIED_BY = field(TEMPLATE, "modified_by", String.class);
    public static final Field<Boolean> TEMPLATE_DELETED = field(TEMPLATE, "deleted", Boolean.class);
    public static final Field<Instant> TEMPLATE_DELETED_AT = field(TEMPLATE, "deleted_at", Instant.class);
    public static final Field<String> TEMPLATE_DELETED_BY = field(TEMPLATE, "deleted_by", String.class);

    // --- attribute ------------------------------------------------------------------------

    public static final Table<?> ATTRIBUTE = DSL.table(DSL.name("attribute"));
    public static final Field<String> ATTRIBUTE_ID = field(ATTRIBUTE, "id", String.class);
    public static final Field<Long> ATTRIBUTE_VERSION = field(ATTRIBUTE, "version", Long.class);
    public static final Field<String> ATTRIBUTE_NAME = field(ATTRIBUTE, "name", String.class);
    public static final Field<String> ATTRIBUTE_TYPE = field(ATTRIBUTE, "attribute_type", String.class);
    public static final Field<String[]> ATTRIBUTE_VALUE_TYPE_IDS = field(ATTRIBUTE, "attribute_value_type_ids", String[].class);
    public static final Field<Instant> ATTRIBUTE_CREATED_AT = field(ATTRIBUTE, "created_at", Instant.class);
    public static final Field<String> ATTRIBUTE_CREATED_BY = field(ATTRIBUTE, "created_by", String.class);
    public static final Field<Instant> ATTRIBUTE_LAST_MODIFIED = field(ATTRIBUTE, "last_modified", Instant.class);
    public static final Field<String> ATTRIBUTE_MODIFIED_BY = field(ATTRIBUTE, "modified_by", String.class);
    public static final Field<Boolean> ATTRIBUTE_DELETED = field(ATTRIBUTE, "deleted", Boolean.class);
    public static final Field<Instant> ATTRIBUTE_DELETED_AT = field(ATTRIBUTE, "deleted_at", Instant.class);
    public static final Field<String> ATTRIBUTE_DELETED_BY = field(ATTRIBUTE, "deleted_by", String.class);

    // --- attribute_type_value -------------------------------------------------------------

    public static final Table<?> ATTRIBUTE_TYPE_VALUE = DSL.table(DSL.name("attribute_type_value"));
    public static final Field<String> ATV_ID = field(ATTRIBUTE_TYPE_VALUE, "id", String.class);
    public static final Field<Long> ATV_VERSION = field(ATTRIBUTE_TYPE_VALUE, "version", Long.class);
    public static final Field<String> ATV_VALUE = field(ATTRIBUTE_TYPE_VALUE, "value", String.class);
    public static final Field<String> ATV_ATTRIBUTE_ID = field(ATTRIBUTE_TYPE_VALUE, "attribute_id", String.class);
    public static final Field<Instant> ATV_CREATED_AT = field(ATTRIBUTE_TYPE_VALUE, "created_at", Instant.class);
    public static final Field<String> ATV_CREATED_BY = field(ATTRIBUTE_TYPE_VALUE, "created_by", String.class);
    public static final Field<Instant> ATV_LAST_MODIFIED = field(ATTRIBUTE_TYPE_VALUE, "last_modified", Instant.class);
    public static final Field<String> ATV_MODIFIED_BY = field(ATTRIBUTE_TYPE_VALUE, "modified_by", String.class);
    public static final Field<Boolean> ATV_DELETED = field(ATTRIBUTE_TYPE_VALUE, "deleted", Boolean.class);
    public static final Field<Instant> ATV_DELETED_AT = field(ATTRIBUTE_TYPE_VALUE, "deleted_at", Instant.class);
    public static final Field<String> ATV_DELETED_BY = field(ATTRIBUTE_TYPE_VALUE, "deleted_by", String.class);

    // --- intelligence_outbox --------------------------------------------------------------

    public static final Table<?> OUTBOX = DSL.table(DSL.name("intelligence_outbox"));
    public static final Field<Long> OUTBOX_ID = field(OUTBOX, "id", Long.class);
    public static final Field<String> OUTBOX_ENTITY_TYPE = field(OUTBOX, "entity_type", String.class);
    public static final Field<String> OUTBOX_ENTITY_ID = field(OUTBOX, "entity_id", String.class);
    public static final Field<String> OUTBOX_OP = field(OUTBOX, "op", String.class);
    public static final Field<Instant> OUTBOX_CREATED_AT = field(OUTBOX, "created_at", Instant.class);
    public static final Field<Instant> OUTBOX_PROCESSED_AT = field(OUTBOX, "processed_at", Instant.class);
    public static final Field<Integer> OUTBOX_ATTEMPT_COUNT = field(OUTBOX, "attempt_count", Integer.class);
    public static final Field<String> OUTBOX_LAST_ERROR = field(OUTBOX, "last_error", String.class);

    /**
     * Holder for the {@code timestamptz}/{@link Instant} {@link DataType}. Wrapped in a nested class
     * so the constant is only resolved when {@link #field(Table, String, Class)} is invoked, instead
     * of during {@code Tables.<clinit>} where it would not yet be assigned (Java initializes static
     * fields top-to-bottom and the field accessors above this declaration call {@code field(...)}).
     */
    private static final class InstantTypeHolder {
        static final DataType<Instant> INSTANT_TZ = SQLDataType.TIMESTAMPWITHTIMEZONE
                .asConvertedDataType(new Converter<>() {
                    @Override
                    public Instant from(OffsetDateTime value) {
                        return value == null ? null : value.toInstant();
                    }

                    @Override
                    public OffsetDateTime to(Instant value) {
                        return value == null ? null : value.atOffset(ZoneOffset.UTC);
                    }

                    @Override
                    public Class<OffsetDateTime> fromType() {
                        return OffsetDateTime.class;
                    }

                    @Override
                    public Class<Instant> toType() {
                        return Instant.class;
                    }
                });
    }

    private static <T> Field<T> field(Table<?> table, String column, Class<T> type) {
        Name name = DSL.name(table.getUnqualifiedName().last(), column);
        if (type == Instant.class) {
            @SuppressWarnings("unchecked")
            Field<T> casted = (Field<T>) DSL.field(name, InstantTypeHolder.INSTANT_TZ);
            return casted;
        }
        return DSL.field(name, type);
    }
}
