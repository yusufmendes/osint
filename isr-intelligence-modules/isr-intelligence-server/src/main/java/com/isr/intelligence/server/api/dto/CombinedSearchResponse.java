package com.isr.intelligence.server.api.dto;

import java.util.List;

public record CombinedSearchResponse(
        List<IntelligenceResponse> records,
        boolean capped
) {}
