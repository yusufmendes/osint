package com.isr.intelligence.server.api.dto;

import java.util.List;
import java.util.Map;

public record SearchResult(
        List<IntelligenceResponse> records,
        Map<String, Map<String, Long>> facets,
        int page,
        int row,
        long total,
        boolean capped
) {}
