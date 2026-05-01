package com.osint.intelligence.server.dto;

public record AttributeTypeValueDto(
        String id,
        long version,
        String value,
        String attributeId,
        AuditDto audit
) {}
