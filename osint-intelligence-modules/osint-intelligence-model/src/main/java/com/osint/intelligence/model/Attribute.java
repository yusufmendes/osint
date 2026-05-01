package com.osint.intelligence.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Schema-level attribute definition on a {@link Template}.
 *
 * <p>{@code attributeValueTypeIdList} holds ids of {@link AttributeTypeValue} rows that define the allowed
 * enumeration options for this attribute. It is populated only when {@link #getAttributeType()} is
 * {@link AttributeType#ENUM} or {@link AttributeType#ENUM_LIST} (multi-select via {@code ENUM_LIST}).
 * For all other types ({@code STRING}, {@code NUMBER}, {@code BOOLEAN}, {@code GEOMETRY}, {@code DATE},
 * {@code GEOMETRY_LIST}, {@code DATE_LIST}) the list is typically empty; runtime values then live in
 * {@link Intelligence#getAttributeIdToAttributeValueMap()} or persistence.</p>
 *
 * <p>Mutable bean; {@link #getAttributeValueTypeIdList()} returns the live list (add/clear in place).</p>
 */
public class Attribute {

    private String id;
    private long version;
    private String name;
    private AttributeType attributeType;
    private final List<String> attributeValueTypeIdList = new ArrayList<>();

    private Instant createdAt;
    private String createdBy;
    private Instant lastModified;
    private String modifiedBy;
    private boolean deleted;
    private Instant deletedAt;
    private String deletedBy;

    public Attribute() {}

    public Attribute(
            String id,
            long version,
            String name,
            AttributeType attributeType,
            List<String> attributeValueTypeIdList) {
        this.id = id;
        this.version = version;
        this.name = name;
        this.attributeType = attributeType;
        setAttributeValueTypeIdList(attributeValueTypeIdList);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public long getVersion() { return version; }
    public void setVersion(long version) { this.version = version; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AttributeType getAttributeType() { return attributeType; }
    public void setAttributeType(AttributeType attributeType) { this.attributeType = attributeType; }

    /**
     * Live, mutable list of {@link AttributeTypeValue} ids (see class Javadoc).
     */
    public List<String> getAttributeValueTypeIdList() { return attributeValueTypeIdList; }

    public void setAttributeValueTypeIdList(List<String> list) {
        attributeValueTypeIdList.clear();
        if (list != null) {
            attributeValueTypeIdList.addAll(list);
        }
    }

    public void addAttributeValueTypeId(String attributeTypeValueId) {
        attributeValueTypeIdList.add(attributeTypeValueId);
    }

    public void addAllAttributeValueTypeIds(Collection<String> ids) {
        if (ids != null) {
            attributeValueTypeIdList.addAll(ids);
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
