package com.osint.intelligence.server.dto;

import java.util.List;

public record TemplateDto(
        String id,
        long version,
        String name,
        List<String> childTemplateIdList,
        List<String> attributeIdList,
        AuditDto audit
) {}
