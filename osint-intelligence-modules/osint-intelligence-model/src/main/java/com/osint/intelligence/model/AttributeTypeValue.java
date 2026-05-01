package com.osint.intelligence.model;

/**
 * A single stored value row for an attribute (often used with ENUM / ENUM_LIST).
 *
 * @param id          stable identifier
 * @param version     optimistic-lock / revision counter
 * @param value       serialized payload (format depends on parent attribute type)
 * @param attributeId owning attribute id
 */
public record AttributeTypeValue(
        String id,
        long version,
        String value,
        String attributeId
) {
}
