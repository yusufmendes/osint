package com.osint.intelligence.server.api.dto;

import java.time.Instant;
import java.util.List;

public record DeltaResponse(
        List<IntelligenceResponse> records,
        Instant serverTime
) {}
