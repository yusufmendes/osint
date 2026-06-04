package com.isr.intelligence.server.dto;

import com.isr.intelligence.model.AttributeType;

import java.util.List;

public record AttributeDto(
        String id,
        long version,
        String name,
        AttributeType attributeType,
        List<String> attributeValueTypeIdList,
        AuditDto audit
) {}
