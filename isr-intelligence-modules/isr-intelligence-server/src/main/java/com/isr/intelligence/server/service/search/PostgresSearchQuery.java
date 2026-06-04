package com.isr.intelligence.server.service.search;

import org.jooq.Condition;
import org.jooq.SortField;

import java.util.List;

public record PostgresSearchQuery(
        Condition condition,
        List<SortField<?>> sortFields,
        int offset,
        int limit,
        boolean hasUserFilters,
        boolean hasGeoFilters
) {}
