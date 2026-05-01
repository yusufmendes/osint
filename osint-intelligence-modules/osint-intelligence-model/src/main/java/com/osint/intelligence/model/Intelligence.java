package com.osint.intelligence.model;

import org.locationtech.jts.geom.Geometry;

import java.util.*;

/**
 * Primary intelligence aggregate: narrative fields, spatial footprint, template link,
 * relations, and a flexible bag of attribute values keyed by attribute id.
 *
 * <p><strong>Mutable bean</strong> — intended for incremental updates and cache-backed graphs: change
 * fields with setters and mutate {@link #getAttributeIdToAttributeValueMap()} with {@link Map#put}
 * without copying the whole object. Not thread-safe; guard shared cached instances externally if needed.</p>
 */
public class Intelligence {

    private String id;
    private long version;
    private String header;
    private String description;
    private Date creationDate;
    private Date lastModificationDate;
    private final List<String> keywords = new ArrayList<>();
    private final List<String> attachedFileUniqueIdList = new ArrayList<>();
    private Geometry location;
    private final List<Geometry> relatedLocationList = new ArrayList<>();
    private String templateId;
    private final List<String> relatedIntelligenceIdList = new ArrayList<>();
    private final Map<String, Object> attributeIdToAttributeValueMap = new HashMap<>();

    public Intelligence() {}

    public Intelligence(
            String id,
            long version,
            String header,
            String description,
            Date creationDate,
            Date lastModificationDate,
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
        this.creationDate = creationDate;
        this.lastModificationDate = lastModificationDate;
        setKeywords(keywords);
        setAttachedFileUniqueIdList(attachedFileUniqueIdList);
        this.location = location;
        setRelatedLocationList(relatedLocationList);
        this.templateId = templateId;
        setRelatedIntelligenceIdList(relatedIntelligenceIdList);
        setAttributeIdToAttributeValueMap(attributeIdToAttributeValueMap);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }

    public String getHeader() {
        return header;
    }

    public void setHeader(String header) {
        this.header = header;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(List<String> list) {
        keywords.clear();
        if (list != null) {
            keywords.addAll(list);
        }
    }

    public void addKeyword(String keyword) {
        keywords.add(keyword);
    }

    public void addAllKeywords(Collection<String> values) {
        if (values != null) {
            keywords.addAll(values);
        }
    }

    public List<String> getAttachedFileUniqueIdList() {
        return attachedFileUniqueIdList;
    }

    public void setAttachedFileUniqueIdList(List<String> list) {
        attachedFileUniqueIdList.clear();
        if (list != null) {
            attachedFileUniqueIdList.addAll(list);
        }
    }

    public Geometry getLocation() {
        return location;
    }

    public void setLocation(Geometry location) {
        this.location = location;
    }

    public List<Geometry> getRelatedLocationList() {
        return relatedLocationList;
    }

    public void setRelatedLocationList(List<Geometry> list) {
        relatedLocationList.clear();
        if (list != null) {
            relatedLocationList.addAll(list);
        }
    }

    public void addRelatedLocation(Geometry geometry) {
        relatedLocationList.add(geometry);
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public List<String> getRelatedIntelligenceIdList() {
        return relatedIntelligenceIdList;
    }

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
     * Live map: use {@link Map#put}, {@link Map#remove}, etc. Keys and values may be {@code null} depending on
     * your persistence/API rules (this implementation is a plain {@link HashMap}).
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

    public Date getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(Date creationDate) {
        this.creationDate = creationDate;
    }

    public Date getLastModificationDate() {
        return lastModificationDate;
    }

    public void setLastModificationDate(Date lastModificationDate) {
        this.lastModificationDate = lastModificationDate;
    }
}
