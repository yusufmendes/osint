package com.osint.intelligence.model;

import java.util.List;

/**
 * Schema-level attribute definition on a {@link Template}.
 *
 * <p>{@code attributeValueTypeIdList} holds ids of {@link AttributeTypeValue} rows that define the allowed
 * enumeration options for this attribute. It is populated only when {@link #attributeType()} is
 * {@link AttributeType#ENUM} or {@link AttributeType#ENUM_LIST} (including multi-select via
 * {@code ENUM_LIST}). For all other types
 * ({@code STRING}, {@code NUMBER}, {@code BOOLEAN}, {@code GEOMETRY}, {@code DATE},
 * {@code GEOMETRY_LIST}, {@code DATE_LIST}) the list is typically empty — attribute payloads then live in
 * {@link Intelligence#attributeIdToAttributeValueMap()} or persistence, depending on the application layer.</p>
 *
 * @param id                         stable identifier
 * @param version                    optimistic-lock / revision counter
 * @param name                       human-readable name
 * @param attributeType              logical type
 * @param attributeValueTypeIdList optional list of {@link AttributeTypeValue} ids (see above)
 */
public record Attribute(
        String id,
        long version,
        String name,
        AttributeType attributeType,
        List<String> attributeValueTypeIdList
) {
    public Attribute {
        attributeValueTypeIdList = attributeValueTypeIdList == null
                ? List.of()
                : List.copyOf(attributeValueTypeIdList);
    }
}
