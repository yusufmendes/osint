package com.osint.intelligence.model;

import java.util.List;

/**
 * Reusable intelligence template: nested templates and ordered attributes.
 *
 * @param id                    stable identifier
 * @param version               optimistic-lock / revision counter
 * @param name                  human-readable name
 * @param childTemplateIdList   ids of embedded / child templates
 * @param attributeIdList       ids of {@link Attribute} rows belonging to this template
 */
public record Template(
        String id,
        long version,
        String name,
        List<String> childTemplateIdList,
        List<String> attributeIdList
) {
    public Template {
        childTemplateIdList = childTemplateIdList == null ? List.of() : List.copyOf(childTemplateIdList);
        attributeIdList = attributeIdList == null ? List.of() : List.copyOf(attributeIdList);
    }
}
