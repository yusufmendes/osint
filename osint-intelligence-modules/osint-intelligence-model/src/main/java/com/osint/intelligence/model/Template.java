package com.osint.intelligence.model;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
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
    private Date creationDate;
    private Date lastModificationDate;
    private final List<String> childTemplateIdList = new ArrayList<>();
    private final List<String> attributeIdList = new ArrayList<>();


    public Template() {}

    public Template(
            String id,
            long version,
            String name,Date creationDate,
            Date lastModificationDate,
            List<String> childTemplateIdList,
            List<String> attributeIdList) {
        this.id = id;
        this.version = version;
        this.name = name;
        this.creationDate = creationDate;
        this.lastModificationDate = lastModificationDate;
        setChildTemplateIdList(childTemplateIdList);
        setAttributeIdList(attributeIdList);
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

    public List<String> getChildTemplateIdList() {
        return childTemplateIdList;
    }

    public void setChildTemplateIdList(List<String> list) {
        childTemplateIdList.clear();
        if (list != null) {
            childTemplateIdList.addAll(list);
        }
    }

    public void addChildTemplateId(String templateId) {
        childTemplateIdList.add(templateId);
    }

    public void addAllChildTemplateIds(Collection<String> ids) {
        if (ids != null) {
            childTemplateIdList.addAll(ids);
        }
    }

    public List<String> getAttributeIdList() {
        return attributeIdList;
    }

    public void setAttributeIdList(List<String> list) {
        attributeIdList.clear();
        if (list != null) {
            attributeIdList.addAll(list);
        }
    }

    public void addAttributeId(String attributeId) {
        attributeIdList.add(attributeId);
    }

    public void addAllAttributeIds(Collection<String> ids) {
        if (ids != null) {
            attributeIdList.addAll(ids);
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
