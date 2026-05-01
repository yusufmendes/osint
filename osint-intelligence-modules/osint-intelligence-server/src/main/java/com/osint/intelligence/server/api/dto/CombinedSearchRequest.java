package com.osint.intelligence.server.api.dto;

public record CombinedSearchRequest(
        String templateId,
        String query,
        String polygonWkt
) {}
