package com.isr.intelligence.server.service.search;

import com.isr.intelligence.model.AttributeType;
import com.isr.intelligence.server.api.dto.QueryHolder;
import com.isr.intelligence.server.api.dto.QueryOperand;
import com.isr.intelligence.server.api.dto.QueryOperator;
import com.isr.intelligence.server.api.dto.SearchQuery;
import com.isr.intelligence.server.db.GeometryWkt;
import com.isr.intelligence.server.db.PostGIS;
import org.jooq.Condition;
import org.jooq.Field;
import org.jooq.SortField;
import org.jooq.impl.DSL;
import org.locationtech.jts.geom.Geometry;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static com.isr.intelligence.server.db.Tables.*;

@Component
public class SearchQueryToPostgresQuery {

    private final SearchFieldResolver resolver;

    public SearchQueryToPostgresQuery(SearchFieldResolver resolver) {
        this.resolver = resolver;
    }

    public PostgresSearchQuery convert(SearchQuery query) {
        String templateId = resolver.findTemplateId(query.queryHolders());
        Condition userCondition = conditionFor(query.queryHolders(), templateId);
        boolean hasUserFilters = userCondition != null;
        boolean hasGeoFilters = hasGeo(query.queryHolders(), templateId);
        Condition condition = INTELLIGENCE_DELETED.eq(false);
        if (userCondition != null) {
            condition = condition.and(userCondition);
        }
        return new PostgresSearchQuery(
                condition,
                sortFields(query, templateId),
                query.offset(),
                query.row(),
                hasUserFilters,
                hasGeoFilters);
    }

    private Condition conditionFor(List<QueryHolder> holders, String templateId) {
        if (holders == null || holders.isEmpty()) {
            return null;
        }
        Condition combined = null;
        for (QueryHolder holder : holders) {
            if (holder == null) {
                continue;
            }
            Condition next = holder.group()
                    ? conditionFor(holder.nestedQueries(), templateId)
                    : leafCondition(holder, templateId);
            if (next == null) {
                continue;
            }
            if (combined == null) {
                combined = next;
            } else if (holder.queryOperand() == QueryOperand.OR) {
                combined = combined.or(next);
            } else {
                combined = combined.and(next);
            }
        }
        return combined;
    }

    private Condition leafCondition(QueryHolder holder, String templateId) {
        ResolvedSearchField field = resolver.resolve(holder.queryFieldName(), templateId);
        QueryOperator op = holder.queryOperator() == null ? QueryOperator.EQ : holder.queryOperator();
        Object raw = resolver.normalizeValue(field, holder.queryFieldValue());

        if (op == QueryOperator.WITHIN_POLYGON || op == QueryOperator.NEAR) {
            return geoCondition(field, op, raw);
        }

        if (field.builtIn()) {
            return builtInCondition(field, op, raw);
        }
        return dynamicCondition(field, op, raw);
    }

    private Condition builtInCondition(ResolvedSearchField field, QueryOperator op, Object raw) {
        return switch (field.logicalName()) {
            case "id" -> stringCondition(INTELLIGENCE_ID, op, raw);
            case "templateId" -> stringCondition(INTELLIGENCE_TEMPLATE_ID, op, raw);
            case "header" -> stringCondition(INTELLIGENCE_HEADER, op, raw);
            case "description" -> stringCondition(INTELLIGENCE_DESCRIPTION, op, raw);
            case "creationDate" -> instantCondition(INTELLIGENCE_CREATED_AT, op, raw);
            case "lastModificationDate", "lastQueryTime" -> instantCondition(INTELLIGENCE_LAST_MODIFIED, op, raw);
            case "keywords" -> keywordsCondition(op, raw);
            default -> throw badRequest("Unsupported built-in search field: " + field.logicalName());
        };
    }

    private Condition dynamicCondition(ResolvedSearchField field, QueryOperator op, Object raw) {
        return switch (field.attributeType()) {
            case STRING, ENUM -> stringCondition(jsonText(field.attributeId()), op, raw);
            case ENUM_LIST -> jsonArrayCondition(field.attributeId(), op, raw);
            case NUMBER -> numberCondition(jsonNumber(field.attributeId()), op, raw);
            case BOOLEAN -> booleanCondition(jsonBoolean(field.attributeId()), op, raw);
            case DATE -> instantCondition(jsonInstant(field.attributeId()), op, raw);
            case GEOMETRY -> geoCondition(field, op, raw);
            case DATE_LIST, GEOMETRY_LIST -> throw badRequest("Unsupported dynamic search type: " + field.attributeType());
        };
    }

    private Condition geoCondition(ResolvedSearchField field, QueryOperator op, Object raw) {
        if (!field.supportsGeo()) {
            throw badRequest("Field does not support geo search: " + field.logicalName());
        }
        Field<Geometry> geometryField = field.builtIn()
                ? INTELLIGENCE_LOCATION
                : DSL.field("ST_GeomFromText(attribute_values ->> {0}, 4326)", GEOMETRY_TYPE, DSL.val(field.attributeId()));
        if (op == QueryOperator.WITHIN_POLYGON) {
            return PostGIS.stContains(geometryField, GeometryWkt.fromWkt(String.valueOf(raw)));
        }
        if (op == QueryOperator.NEAR) {
            Near near = near(raw);
            return PostGIS.stDWithin(geometryField, near.lon(), near.lat(), near.km() * 1000.0);
        }
        throw badRequest("Unsupported geo operator: " + op);
    }

    private Condition stringCondition(Field<String> field, QueryOperator op, Object raw) {
        return switch (op) {
            case EQ -> field.eq(string(raw));
            case NE -> field.ne(string(raw));
            case CONTAINS -> field.containsIgnoreCase(string(raw));
            case IN -> field.in(asList(raw).stream().map(String::valueOf).toList());
            case NOT_IN -> field.notIn(asList(raw).stream().map(String::valueOf).toList());
            default -> throw badRequest("Unsupported string operator: " + op);
        };
    }

    private Condition numberCondition(Field<BigDecimal> field, QueryOperator op, Object raw) {
        return switch (op) {
            case EQ -> field.eq(number(raw));
            case NE -> field.ne(number(raw));
            case GT -> field.gt(number(raw));
            case GTE -> field.ge(number(raw));
            case LT -> field.lt(number(raw));
            case LTE -> field.le(number(raw));
            case BETWEEN -> {
                List<Object> values = asList(raw);
                if (values.size() != 2) {
                    throw badRequest("BETWEEN requires exactly two values");
                }
                yield field.between(number(values.get(0)), number(values.get(1)));
            }
            default -> throw badRequest("Unsupported number operator: " + op);
        };
    }

    private Condition booleanCondition(Field<Boolean> field, QueryOperator op, Object raw) {
        return switch (op) {
            case EQ -> field.eq(Boolean.parseBoolean(String.valueOf(raw)));
            case NE -> field.ne(Boolean.parseBoolean(String.valueOf(raw)));
            default -> throw badRequest("Unsupported boolean operator: " + op);
        };
    }

    private Condition instantCondition(Field<Instant> field, QueryOperator op, Object raw) {
        return switch (op) {
            case EQ -> field.eq(instant(raw));
            case NE -> field.ne(instant(raw));
            case GT -> field.gt(instant(raw));
            case GTE -> field.ge(instant(raw));
            case LT -> field.lt(instant(raw));
            case LTE -> field.le(instant(raw));
            case BETWEEN -> {
                List<Object> values = asList(raw);
                if (values.size() != 2) {
                    throw badRequest("BETWEEN requires exactly two values");
                }
                yield field.between(instant(values.get(0)), instant(values.get(1)));
            }
            default -> throw badRequest("Unsupported date operator: " + op);
        };
    }

    private Condition keywordsCondition(QueryOperator op, Object raw) {
        if (op != QueryOperator.CONTAINS && op != QueryOperator.EQ) {
            throw badRequest("Unsupported keywords operator: " + op);
        }
        return DSL.condition("{0} @> {1}", INTELLIGENCE_KEYWORDS, DSL.val(new String[] { string(raw) }));
    }

    private Condition jsonArrayCondition(String attributeId, QueryOperator op, Object raw) {
        List<String> values = asList(raw).stream().map(String::valueOf).toList();
        Condition any = null;
        for (String value : values) {
            Condition next = DSL.condition("(attribute_values -> {0}) ? {1}", DSL.val(attributeId), DSL.val(value));
            any = any == null ? next : any.or(next);
        }
        if (any == null) {
            any = DSL.falseCondition();
        }
        return switch (op) {
            case EQ, CONTAINS, IN -> any;
            case NE, NOT_IN -> any.not();
            default -> throw badRequest("Unsupported enum-list operator: " + op);
        };
    }

    private List<SortField<?>> sortFields(SearchQuery query, String templateId) {
        if (query.sortField().isBlank()) {
            return List.of(INTELLIGENCE_LAST_MODIFIED.desc(), INTELLIGENCE_ID.asc());
        }
        ResolvedSearchField field = resolver.resolve(query.sortField(), templateId);
        if (!field.supportsSort()) {
            throw badRequest("Field does not support sorting: " + query.sortField());
        }
        SortField<?> primary = sortField(field, query.sortAsc());
        return List.of(primary, INTELLIGENCE_ID.asc());
    }

    private SortField<?> sortField(ResolvedSearchField field, boolean asc) {
        Field<?> sort = switch (field.logicalName()) {
            case "id" -> INTELLIGENCE_ID;
            case "templateId" -> INTELLIGENCE_TEMPLATE_ID;
            case "header" -> INTELLIGENCE_HEADER;
            case "description" -> INTELLIGENCE_DESCRIPTION;
            case "creationDate" -> INTELLIGENCE_CREATED_AT;
            case "lastModificationDate", "lastQueryTime" -> INTELLIGENCE_LAST_MODIFIED;
            default -> dynamicSortField(field);
        };
        return asc ? sort.asc() : sort.desc();
    }

    private Field<?> dynamicSortField(ResolvedSearchField field) {
        return switch (field.attributeType()) {
            case STRING, ENUM -> jsonText(field.attributeId());
            case NUMBER -> jsonNumber(field.attributeId());
            case BOOLEAN -> jsonBoolean(field.attributeId());
            case DATE -> jsonInstant(field.attributeId());
            default -> throw badRequest("Field does not support sorting: " + field.logicalName());
        };
    }

    private boolean hasGeo(List<QueryHolder> holders, String templateId) {
        if (holders == null) {
            return false;
        }
        for (QueryHolder holder : holders) {
            if (holder == null) {
                continue;
            }
            if (holder.group() && hasGeo(holder.nestedQueries(), templateId)) {
                return true;
            }
            if (!holder.group()) {
                ResolvedSearchField field = resolver.resolve(holder.queryFieldName(), templateId);
                QueryOperator op = holder.queryOperator() == null ? QueryOperator.EQ : holder.queryOperator();
                if (field.supportsGeo() || op == QueryOperator.WITHIN_POLYGON || op == QueryOperator.NEAR) {
                    return true;
                }
            }
        }
        return false;
    }

    private static Field<String> jsonText(String attributeId) {
        return DSL.field("attribute_values ->> {0}", String.class, DSL.val(attributeId));
    }

    private static Field<BigDecimal> jsonNumber(String attributeId) {
        return DSL.field("(attribute_values ->> {0})::numeric", BigDecimal.class, DSL.val(attributeId));
    }

    private static Field<Boolean> jsonBoolean(String attributeId) {
        return DSL.field("(attribute_values ->> {0})::boolean", Boolean.class, DSL.val(attributeId));
    }

    private static Field<Instant> jsonInstant(String attributeId) {
        return DSL.field("(attribute_values ->> {0})::timestamptz", Instant.class, DSL.val(attributeId));
    }

    private static List<Object> asList(Object raw) {
        if (raw instanceof Collection<?> collection) {
            return collection.stream().map(v -> (Object) v).toList();
        }
        return List.of(raw);
    }

    private static String string(Object raw) {
        if (raw == null) {
            throw badRequest("Query value is required");
        }
        return String.valueOf(raw);
    }

    private static BigDecimal number(Object raw) {
        return new BigDecimal(string(raw));
    }

    private static Instant instant(Object raw) {
        return Instant.parse(string(raw));
    }

    @SuppressWarnings("unchecked")
    private static Near near(Object raw) {
        if (!(raw instanceof Map<?, ?> map)) {
            throw badRequest("NEAR requires an object with lat, lon and km");
        }
        return new Near(
                Double.parseDouble(String.valueOf(map.get("lat"))),
                Double.parseDouble(String.valueOf(map.get("lon"))),
                Double.parseDouble(String.valueOf(map.get("km"))));
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record Near(double lat, double lon, double km) {}
}
