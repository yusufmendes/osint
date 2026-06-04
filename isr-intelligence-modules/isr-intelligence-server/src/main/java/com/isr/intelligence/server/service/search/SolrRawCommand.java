package com.isr.intelligence.server.service.search;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record SolrRawCommand(
        String query,
        List<String> filterQueries,
        Map<String, String> facetLogicalNamesBySolrField,
        int start,
        int rows,
        String sortField,
        boolean sortAsc,
        boolean filtersComplete
) {
    public SolrRawCommand {
        query = query == null || query.isBlank() ? "*:*" : query;
        filterQueries = filterQueries == null ? List.of() : List.copyOf(filterQueries);
        facetLogicalNamesBySolrField = facetLogicalNamesBySolrField == null
                ? Map.of()
                : new LinkedHashMap<>(facetLogicalNamesBySolrField);
    }

    public SolrRawCommand withRows(int start, int rows) {
        return new SolrRawCommand(query, filterQueries, facetLogicalNamesBySolrField,
                Math.max(start, 0), Math.max(rows, 0), sortField, sortAsc, filtersComplete);
    }

    public SolrRawCommand withIdFilter(List<String> ids) {
        List<String> filters = new ArrayList<>(filterQueries);
        if (ids == null || ids.isEmpty()) {
            filters.add("id:\"__no_match__\"");
        } else {
            String joined = ids.stream()
                    .map(SolrRawCommand::quote)
                    .reduce((a, b) -> a + " OR " + b)
                    .orElse("\"__no_match__\"");
            filters.add("id:(" + joined + ")");
        }
        return new SolrRawCommand(query, filters, facetLogicalNamesBySolrField,
                start, rows, sortField, sortAsc, filtersComplete);
    }

    private static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
