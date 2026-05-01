package com.osint.intelligence.model;

import java.time.Instant;

/**
 * A single stored value row for an attribute (often used with ENUM / ENUM_LIST).
 *
 * <p>Mutable bean so the same instance can be updated or held in a cache without replacing the object.</p>
 */
public class AttributeTypeValue {

    private String id;
    private long version;
    private String value;
    private String attributeId;

    private Instant createdAt;
    private String createdBy;
    private Instant lastModified;
    private String modifiedBy;
    private boolean deleted;
    private Instant deletedAt;
    private String deletedBy;

    public AttributeTypeValue() {}

    public AttributeTypeValue(String id, long version, String value, String attributeId) {
        this.id = id;
        this.version = version;
        this.value = value;
        this.attributeId = attributeId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getAttributeId() { return attributeId; }
    public void setAttributeId(String attributeId) { this.attributeId = attributeId; }

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
