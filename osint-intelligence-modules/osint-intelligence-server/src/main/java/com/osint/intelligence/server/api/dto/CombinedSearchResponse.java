package com.osint.intelligence.server.api.dto;

import java.util.List;

public record CombinedSearchResponse(
        List<IntelligenceResponse> records,
        boolean capped
) {}
