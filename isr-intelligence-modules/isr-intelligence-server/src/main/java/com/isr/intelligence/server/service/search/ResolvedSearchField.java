package com.isr.intelligence.server.service.search;

import com.isr.intelligence.model.AttributeType;

public record ResolvedSearchField(
        String logicalName,
        String attributeId,
        AttributeType attributeType,
        boolean builtIn,
        String pgField,
        String solrField,
        boolean supportsText,
        boolean supportsGeo,
        boolean supportsSort
) {}
