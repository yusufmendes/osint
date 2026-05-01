package com.osint.intelligence.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Reusable intelligence template: nested templates and ordered attributes.
 *
 * <p>Mutable bean; list getters return live {@link ArrayList} instances.</p>
 */
public class Template {

    private String id;
    private long version;
    private String name;
    private final List<String> childTemplateIdList = new ArrayList<>();
    private final List<String> attributeIdList = new ArrayList<>();

    private Instant createdAt;
    private String createdBy;
    private Instant lastModified;
    private String modifiedBy;
    private boolean deleted;
    private Instant deletedAt;
    private String deletedBy;

    public Template() {}

    public Template(
            String id,
            long version,
            String name,
            List<String> childTemplateIdList,
            List<String> attributeIdList) {
        this.id = id;
        this.version = version;
        this.name = name;
        setChildTemplateIdList(childTemplateIdList);
        setAttributeIdList(attributeIdList);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<String> getChildTemplateIdList() { return childTemplateIdList; }

    public void setChildTemplateIdList(List<String> list) {
        childTemplateIdList.clear();
        if (list != null) {
            childTemplateIdList.addAll(list);
        }
    }

    public void addChildTemplateId(String templateId) { childTemplateIdList.add(templateId); }

    public void addAllChildTemplateIds(Collection<String> ids) {
        if (ids != null) {
            childTemplateIdList.addAll(ids);
        }
    }

    public List<String> getAttributeIdList() { return attributeIdList; }

    public void setAttributeIdList(List<String> list) {
        attributeIdList.clear();
        if (list != null) {
            attributeIdList.addAll(list);
        }
    }

    public void addAttributeId(String attributeId) { attributeIdList.add(attributeId); }

    public void addAllAttributeIds(Collection<String> ids) {
        if (ids != null) {
            attributeIdList.addAll(ids);
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
