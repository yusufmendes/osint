package com.osint.intelligence.model;

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

    public AttributeTypeValue() {}

    public AttributeTypeValue(String id, long version, String value, String attributeId) {
        this.id = id;
        this.version = version;
        this.value = value;
        this.attributeId = attributeId;
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

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getAttributeId() {
        return attributeId;
    }

    public void setAttributeId(String attributeId) {
        this.attributeId = attributeId;
    }
}
