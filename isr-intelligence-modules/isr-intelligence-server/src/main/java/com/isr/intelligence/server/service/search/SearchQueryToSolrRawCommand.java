package com.isr.intelligence.server.service.search;

import com.isr.intelligence.server.api.dto.QueryHolder;
import com.isr.intelligence.server.api.dto.QueryOperand;
import com.isr.intelligence.server.api.dto.QueryOperator;
import com.isr.intelligence.server.api.dto.SearchQuery;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SearchQueryToSolrRawCommand {

    private final SearchFieldResolver resolver;

    public SearchQueryToSolrRawCommand(SearchFieldResolver resolver) {
        this.resolver = resolver;
    }

    public SolrRawCommand convert(SearchQuery query) {
        String templateId = resolver.findTemplateId(query.queryHolders());
        SolrExpression filters = expressionFor(query.queryHolders(), templateId);
        List<String> filterQueries = filters.expression() == null
                ? List.of()
                : List.of(filters.expression());

        return new SolrRawCommand(
                query.q(),
                filterQueries,
                facets(query.facetFields(), templateId),
                query.offset(),
                query.row(),
                sortField(query.sortField(), templateId),
                query.sortAsc(),
                filters.complete());
    }

    private Map<String, String> facets(List<String> facetFields, String templateId) {
        if (facetFields == null || facetFields.isEmpty()) {
            return Map.of();
        }
        Map<String, String> result = new LinkedHashMap<>();
        for (String facetField : facetFields) {
            ResolvedSearchField resolved = resolver.resolve(facetField, templateId);
            result.put(resolved.solrField(), resolved.logicalName());
        }
        return result;
    }

    private String sortField(String sortField, String templateId) {
        if (sortField == null || sortField.isBlank()) {
            return "";
        }
        return resolver.resolve(sortField, templateId).solrField();
    }

    private SolrExpression expressionFor(List<QueryHolder> holders, String templateId) {
        if (holders == null || holders.isEmpty()) {
            return SolrExpression.complete(null);
        }

        String combined = null;
        boolean complete = true;
        for (QueryHolder holder : holders) {
            if (holder == null) {
                continue;
            }
            SolrExpression next = holder.group()
                    ? expressionFor(holder.nestedQueries(), templateId)
                    : leafExpression(holder, templateId);
            if (!next.complete()) {
                complete = false;
            }
            if (next.expression() == null) {
                if (holder.queryOperand() == QueryOperand.OR && combined != null) {
                    return new SolrExpression(null, false);
                }
                continue;
            }
            if (combined == null) {
                combined = next.expression();
            } else if (holder.queryOperand() == QueryOperand.OR) {
                combined = "(" + combined + " OR " + next.expression() + ")";
            } else {
                combined = "(" + combined + " AND " + next.expression() + ")";
            }
        }
        return new SolrExpression(combined, complete);
    }

    private SolrExpression leafExpression(QueryHolder holder, String templateId) {
        ResolvedSearchField field = resolver.resolve(holder.queryFieldName(), templateId);
        QueryOperator op = holder.queryOperator() == null ? QueryOperator.EQ : holder.queryOperator();
        if (field.supportsGeo() || op == QueryOperator.WITHIN_POLYGON || op == QueryOperator.NEAR) {
            return new SolrExpression(null, false);
        }
        Object raw = resolver.normalizeValue(field, holder.queryFieldValue());
        String expr = switch (field.attributeType()) {
            case STRING -> stringExpression(field.solrField(), op, raw, true);
            case ENUM, BOOLEAN -> stringExpression(field.solrField(), op, raw, false);
            case ENUM_LIST -> collectionExpression(field.solrField(), op, raw);
            case NUMBER -> rangeableExpression(field.solrField(), op, raw, ValueKind.NUMBER);
            case DATE, DATE_LIST -> rangeableExpression(field.solrField(), op, raw, ValueKind.DATE);
            case GEOMETRY, GEOMETRY_LIST -> null;
        };
        return expr == null ? new SolrExpression(null, false) : SolrExpression.complete(expr);
    }

    private String stringExpression(String field, QueryOperator op, Object raw, boolean text) {
        return switch (op) {
            case EQ -> field + ":" + quote(string(raw));
            case NE -> "-" + field + ":" + quote(string(raw));
            case CONTAINS -> text ? field + ":" + escapedToken(string(raw)) : null;
            case IN -> field + ":(" + quotedList(raw) + ")";
            case NOT_IN -> "-" + field + ":(" + quotedList(raw) + ")";
            default -> null;
        };
    }

    private String collectionExpression(String field, QueryOperator op, Object raw) {
        return switch (op) {
            case EQ, CONTAINS, IN -> field + ":(" + quotedList(raw) + ")";
            case NE, NOT_IN -> "-" + field + ":(" + quotedList(raw) + ")";
            default -> null;
        };
    }

    private String rangeableExpression(String field, QueryOperator op, Object raw, ValueKind kind) {
        return switch (op) {
            case EQ -> field + ":" + literal(raw, kind);
            case NE -> "-" + field + ":" + literal(raw, kind);
            case GT -> field + ":{" + literal(raw, kind) + " TO *]";
            case GTE -> field + ":[" + literal(raw, kind) + " TO *]";
            case LT -> field + ":[* TO " + literal(raw, kind) + "}";
            case LTE -> field + ":[* TO " + literal(raw, kind) + "]";
            case BETWEEN -> {
                List<Object> values = asList(raw);
                if (values.size() != 2) {
                    yield null;
                }
                yield field + ":[" + literal(values.get(0), kind) + " TO " + literal(values.get(1), kind) + "]";
            }
            case IN -> field + ":(" + literalList(raw, kind) + ")";
            case NOT_IN -> "-" + field + ":(" + literalList(raw, kind) + ")";
            default -> null;
        };
    }

    private String quotedList(Object raw) {
        return asList(raw).stream()
                .map(v -> quote(string(v)))
                .reduce((a, b) -> a + " OR " + b)
                .orElse("\"__no_match__\"");
    }

    private String literalList(Object raw, ValueKind kind) {
        return asList(raw).stream()
                .map(v -> literal(v, kind))
                .reduce((a, b) -> a + " OR " + b)
                .orElse("__no_match__");
    }

    private String literal(Object raw, ValueKind kind) {
        String value = string(raw);
        if (kind == ValueKind.DATE) {
            return Instant.parse(value).toString();
        }
        return value;
    }

    private static List<Object> asList(Object raw) {
        if (raw instanceof Collection<?> collection) {
            return new ArrayList<>(collection.stream().map(v -> (Object) v).toList());
        }
        return List.of(raw);
    }

    private static String string(Object raw) {
        return raw == null ? "" : String.valueOf(raw);
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String escapedToken(String value) {
        StringBuilder out = new StringBuilder(value.length());
        for (char c : value.toCharArray()) {
            if ("+-!():^[]\"{}~*?|&;/\\".indexOf(c) >= 0) {
                out.append('\\');
            }
            out.append(c);
        }
        return out.toString();
    }

    private enum ValueKind {
        NUMBER,
        DATE
    }

    private record SolrExpression(String expression, boolean complete) {
        static SolrExpression complete(String expression) {
            return new SolrExpression(expression, true);
        }
    }
}
