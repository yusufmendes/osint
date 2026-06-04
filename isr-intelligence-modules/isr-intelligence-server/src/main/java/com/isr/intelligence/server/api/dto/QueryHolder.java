package com.isr.intelligence.server.api.dto;

import java.util.List;

public record QueryHolder(
        String queryFieldName,
        Object queryFieldValue,
        QueryOperator queryOperator,
        QueryOperand queryOperand,
        List<QueryHolder> nestedQueries
) {
    public QueryHolder {
        queryOperand = queryOperand == null ? QueryOperand.AND : queryOperand;
        nestedQueries = nestedQueries == null ? List.of() : List.copyOf(nestedQueries);
    }

    public boolean group() {
        return queryFieldName == null || queryFieldName.isBlank();
    }
}
