package com.isr.intelligence.server.api.dto;

import java.util.List;

public record SearchQuery(
        List<QueryHolder> queryHolders,
        int page,
        int row,
        String sortField,
        boolean sortAsc,
        String q,
        List<String> facetFields
) {
    public SearchQuery {
        queryHolders = queryHolders == null ? List.of() : List.copyOf(queryHolders);
        facetFields = facetFields == null ? List.of() : List.copyOf(facetFields);
        page = Math.max(page, 0);
        row = row <= 0 ? 100 : row;
        q = q == null ? "" : q.trim();
        sortField = sortField == null ? "" : sortField.trim();
    }

    public int offset() {
        return page * row;
    }
}
