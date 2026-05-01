package com.osint.intelligence.server.dto;

import org.locationtech.jts.geom.Geometry;

import java.util.List;
import java.util.Map;

public record IntelligenceDto(
        String id,
        long version,
        String header,
        String description,
        List<String> keywords,
        List<String> attachedFileUniqueIdList,
        Geometry location,
        List<Geometry> relatedLocationList,
        String templateId,
        List<String> relatedIntelligenceIdList,
        Map<String, Object> attributeIdToAttributeValueMap,
        AuditDto audit
) {}
