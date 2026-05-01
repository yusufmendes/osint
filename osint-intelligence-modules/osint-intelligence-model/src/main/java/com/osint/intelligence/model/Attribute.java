package com.osint.intelligence.model;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

/**
 * Schema-level attribute definition on a {@link Template}.
 *
 * <p>{@code attributeValueTypeIdList} holds ids of {@link AttributeTypeValue} rows that define the allowed
 * enumeration options for this attribute. It is populated only when {@link #getAttributeType()} is
 * {@link AttributeType#ENUM} or {@link AttributeType#ENUM_LIST} (including multi-select via
 * {@code ENUM_LIST}). For all other types
 * ({@code STRING}, {@code NUMBER}, {@code BOOLEAN}, {@code GEOMETRY}, {@code DATE},
 * {@code GEOMETRY_LIST}, {@code DATE_LIST}) the list is typically empty — attribute payloads then live in
 * {@link Intelligence#getAttributeIdToAttributeValueMap()} or persistence, depending on the application layer.</p>
 *
 * <p>Mutable bean; {@link #getAttributeValueTypeIdList()} returns the live list (add/clear in place).</p>
 */
public class Attribute {

    private String id;
    private long version;
    private String name;
    private Date creationDate;
    private Date lastModificationDate;
    private AttributeType attributeType;
    private final List<String> attributeValueTypeIdList = new ArrayList<>();

    public Attribute() {}

    public Attribute(
            String id,
            long version,
            String name,
            Date creationDate,
            Date lastModificationDate,
            AttributeType attributeType,
            List<String> attributeValueTypeIdList) {
        this.id = id;
        this.version = version;
        this.name = name;
        this.creationDate = creationDate;
        this.lastModificationDate = lastModificationDate;
        this.attributeType = attributeType;
        setAttributeValueTypeIdList(attributeValueTypeIdList);
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AttributeType getAttributeType() {
        return attributeType;
    }

    public void setAttributeType(AttributeType attributeType) {
        this.attributeType = attributeType;
    }

    /**
     * Live, mutable list of {@link AttributeTypeValue} ids (see class Javadoc).
     */
    public List<String> getAttributeValueTypeIdList() {
        return attributeValueTypeIdList;
    }

    /**
     * Replaces contents with a copy of {@code list} (or clears if {@code null}).
     */
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
