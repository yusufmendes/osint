package com.osint.intelligence.model;

import org.locationtech.jts.geom.Geometry;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Primary intelligence aggregate: narrative fields, spatial footprint, template link,
 * relations, and a flexible bag of attribute values keyed by attribute id.
 *
 * @param id                             stable identifier
 * @param version                        optimistic-lock / revision counter
 * @param header                         short title
 * @param description                    body text
 * @param keywords                       free-text keywords / tags
 * @param attachedFileUniqueIdList       opaque file ids managed by a storage service
 * @param location                       primary geometry (JTS); may be {@code null}
 * @param relatedLocationList            additional geometries; empty if none
 * @param templateId                     {@link Template} id this row conforms to
 * @param relatedIntelligenceIdList      graph links to other intelligence ids
 * @param attributeIdToAttributeValueMap runtime attribute payload keyed by {@link Attribute} id;
 *                                       values are intentionally {@link Object} (JSON-friendly primitives,
 *                                       strings, nested maps, etc.)
 */
public record Intelligence(
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
        Map<String, Object> attributeIdToAttributeValueMap
) {
    public Intelligence {
        keywords = keywords == null ? List.of() : List.copyOf(keywords);
        attachedFileUniqueIdList = attachedFileUniqueIdList == null ? List.of() : List.copyOf(attachedFileUniqueIdList);
        relatedLocationList = relatedLocationList == null ? List.of() : List.copyOf(relatedLocationList);
        relatedIntelligenceIdList = relatedIntelligenceIdList == null ? List.of() : List.copyOf(relatedIntelligenceIdList);
        attributeIdToAttributeValueMap = attributeIdToAttributeValueMap == null
                ? Map.of()
                : Map.copyOf(attributeIdToAttributeValueMap);
    }

    /**
     * Returns a copy of this intelligence with one extra or updated attribute entry (same semantics as
     * {@link Map#put(Object, Object)} on a mutable map, but this record stays immutable).
     *
     * @param attributeId {@link Attribute} id; must not be {@code null}
     * @param value       payload; must not be {@code null} (required so the stored map stays {@link Map#copyOf}-compatible)
     */
    public Intelligence withAttributeValue(String attributeId, Object value) {
        Objects.requireNonNull(attributeId, "attributeId");
        Objects.requireNonNull(value, "value");
        Map<String, Object> next = new HashMap<>(attributeIdToAttributeValueMap);
        next.put(attributeId, value);
        return new Intelligence(
                id,
                version,
                header,
                description,
                keywords,
                attachedFileUniqueIdList,
                location,
                relatedLocationList,
                templateId,
                relatedIntelligenceIdList,
                next);
    }

    /**
     * Like repeated {@link #withAttributeValue(String, Object)} for each entry in {@code additions}.
     * Later keys in {@code additions} win on collision. Null map is treated as empty.
     */
    public Intelligence withAttributeValues(Map<String, Object> additions) {
        if (additions == null || additions.isEmpty()) {
            return this;
        }
        Map<String, Object> next = new HashMap<>(attributeIdToAttributeValueMap);
        for (Map.Entry<String, Object> e : additions.entrySet()) {
            String k = Objects.requireNonNull(e.getKey(), "attributeId");
            Object v = Objects.requireNonNull(e.getValue(), "value");
            next.put(k, v);
        }
        return new Intelligence(
                id,
                version,
                header,
                description,
                keywords,
                attachedFileUniqueIdList,
                location,
                relatedLocationList,
                templateId,
                relatedIntelligenceIdList,
                next);
    }
}
