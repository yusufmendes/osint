package com.osint.intelligence.model;

import org.locationtech.jts.geom.Geometry;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Primary intelligence aggregate: narrative fields, spatial footprint, template link,
 * relations, and a flexible bag of attribute values keyed by attribute id.
 *
 * <p><strong>Mutable bean</strong> — intended for incremental updates and cache-backed graphs: change
 * fields with setters and mutate {@link #getAttributeIdToAttributeValueMap()} with {@link Map#put}
 * without copying the whole object. Not thread-safe; guard shared cached instances externally if needed.</p>
 *
 * <h2>{@code attributeIdToAttributeValueMap} representation</h2>
 * <p>In Java memory the map is keyed by {@link Attribute#getId()}; values are
 * {@link AttributeTypeValue#getId()} for {@link AttributeType#ENUM}/{@link AttributeType#ENUM_LIST} and the raw
 * scalar otherwise. Postgres JSONB and Solr store the same data keyed by {@link Attribute#getName()} with
 * value = {@link AttributeTypeValue#getValue()} (for enums) or the raw scalar — the outbox worker performs
 * the {@code id -> name} translation when writing the storage form.</p>
 */
public class Intelligence {

    private String id;
    private long version;
    private String header;
    private String description;
    private final List<String> keywords = new ArrayList<>();
    private final List<String> attachedFileUniqueIdList = new ArrayList<>();
    private Geometry location;
    private final List<Geometry> relatedLocationList = new ArrayList<>();
    private String templateId;
    private final List<String> relatedIntelligenceIdList = new ArrayList<>();
    private final Map<String, Object> attributeIdToAttributeValueMap = new HashMap<>();

    private Instant createdAt;
    private String createdBy;
    private Instant lastModified;
    private String modifiedBy;
    private boolean deleted;
    private Instant deletedAt;
    private String deletedBy;

    public Intelligence() {}

    public Intelligence(
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
            Map<String, Object> attributeIdToAttributeValueMap) {
        this.id = id;
        this.version = version;
        this.header = header;
        this.description = description;
        setKeywords(keywords);
        setAttachedFileUniqueIdList(attachedFileUniqueIdList);
        this.location = location;
        setRelatedLocationList(relatedLocationList);
        this.templateId = templateId;
        setRelatedIntelligenceIdList(relatedIntelligenceIdList);
        setAttributeIdToAttributeValueMap(attributeIdToAttributeValueMap);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public String getHeader() { return header; }
    public void setHeader(String header) { this.header = header; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getKeywords() { return keywords; }

    public void setKeywords(List<String> list) {
        keywords.clear();
        if (list != null) {
            keywords.addAll(list);
        }
    }

    public void addKeyword(String keyword) { keywords.add(keyword); }

    public void addAllKeywords(Collection<String> values) {
        if (values != null) {
            keywords.addAll(values);
        }
    }

    public List<String> getAttachedFileUniqueIdList() { return attachedFileUniqueIdList; }

    public void setAttachedFileUniqueIdList(List<String> list) {
        attachedFileUniqueIdList.clear();
        if (list != null) {
            attachedFileUniqueIdList.addAll(list);
        }
    }

    public Geometry getLocation() { return location; }
    public void setLocation(Geometry location) { this.location = location; }

    public List<Geometry> getRelatedLocationList() { return relatedLocationList; }

    public void setRelatedLocationList(List<Geometry> list) {
        relatedLocationList.clear();
        if (list != null) {
            relatedLocationList.addAll(list);
        }
    }

    public void addRelatedLocation(Geometry geometry) { relatedLocationList.add(geometry); }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public List<String> getRelatedIntelligenceIdList() { return relatedIntelligenceIdList; }

    public void setRelatedIntelligenceIdList(List<String> list) {
        relatedIntelligenceIdList.clear();
        if (list != null) {
            relatedIntelligenceIdList.addAll(list);
        }
    }

    public void addRelatedIntelligenceId(String intelligenceId) {
        relatedIntelligenceIdList.add(intelligenceId);
    }

    /**
     * Live map keyed by {@link Attribute#getId()} (see class Javadoc for storage-side rules).
     */
    public Map<String, Object> getAttributeIdToAttributeValueMap() {
        return attributeIdToAttributeValueMap;
    }

    public void setAttributeIdToAttributeValueMap(Map<String, Object> map) {
        attributeIdToAttributeValueMap.clear();
        if (map != null) {
            attributeIdToAttributeValueMap.putAll(map);
        }
    }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getLastModified() { return lastModified; }
    public void setLastModified(Instant lastModified) { this.lastModified = lastModified; }

    public String getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(String modifiedBy) { this.modifiedBy = modifiedBy; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public String getDeletedBy() { return deletedBy; }
    public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }
}
