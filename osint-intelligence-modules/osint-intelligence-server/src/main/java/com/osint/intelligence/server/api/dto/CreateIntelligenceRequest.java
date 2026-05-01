package com.osint.intelligence.server.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

/**
 * Web payload for create/update. Geometries arrive as WKT strings.
 */
public record CreateIntelligenceRequest(
        String id,
        Long version,
        String header,
        String description,
        List<String> keywords,
        List<String> attachedFileUniqueIdList,
        String locationWkt,
        List<String> relatedLocationWktList,
        @NotBlank String templateId,
        List<String> relatedIntelligenceIdList,
        Map<String, Object> attributeIdToAttributeValueMap
) {}
