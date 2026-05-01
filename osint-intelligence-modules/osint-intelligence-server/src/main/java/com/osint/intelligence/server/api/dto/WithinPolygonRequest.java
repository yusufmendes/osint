package com.osint.intelligence.server.api.dto;

import jakarta.validation.constraints.NotBlank;

public record WithinPolygonRequest(
        String templateId,
        @NotBlank String polygonWkt
) {}
