package com.osint.intelligence.server.service;

import com.osint.intelligence.model.AttributeType;
import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import org.apache.solr.common.SolrInputDocument;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Translates an in-memory {@link IntelligenceDto} (id-keyed JSONB form) into a Solr document with the
 * name-keyed dynamic-field form, using the cache for {@code id -> name} translation.
 */
@Service
public class SolrIndexer {

    private final AttributeCacheService cache;

    public SolrIndexer(AttributeCacheService cache) {
        this.cache = cache;
    }

    public SolrInputDocument toSolrDocument(IntelligenceDto dto) {
        SolrInputDocument doc = new SolrInputDocument();
        doc.setField("id", dto.id());
        doc.setField("templateId", dto.templateId());
        doc.setField("header", dto.header());
        doc.setField("description", dto.description());
        doc.setField("creationDate", dto.audit().createdAt());
        doc.setField("lastModificationDate", dto.audit().lastModified());
        doc.setField("keywords", dto.keywords());
        doc.setField("attachedFileUniqueIdList", dto.attachedFileUniqueIdList());
        doc.setField("relatedIntelligenceIdList", dto.relatedIntelligenceIdList());

        if (dto.location() != null) {
            doc.setField("location", toLatLon(dto.location()));
        }
        if (dto.relatedLocationList() != null && !dto.relatedLocationList().isEmpty()) {
            List<String> latlons = new ArrayList<>(dto.relatedLocationList().size());
            for (Geometry g : dto.relatedLocationList()) {
                String s = toLatLon(g);
                if (s != null) {
                    latlons.add(s);
                }
            }
            doc.setField("relatedLocationList", latlons);
        }

        for (Map.Entry<String, Object> entry : dto.attributeIdToAttributeValueMap().entrySet()) {
            AttributeDto attr = cache.attribute(entry.getKey());
            if (attr == null) {
                continue;
            }
            String suffix = suffixFor(attr.attributeType());
            String fieldName = attr.name() + suffix;
            Object translated = translateValue(attr.attributeType(), entry.getValue());
            if (translated != null) {
                doc.setField(fieldName, translated);
            }
        }
        return doc;
    }

    /**
     * Solr dynamic suffix for the given {@link AttributeType}.
     */
    private String suffixFor(AttributeType type) {
        return switch (type) {
            case STRING, ENUM -> "_s";
            case NUMBER -> "_l";
            case BOOLEAN -> "_b";
            case DATE -> "_dt";
            case GEOMETRY, GEOMETRY_LIST -> "_srpt";
            case ENUM_LIST -> "_ss";
            case DATE_LIST -> "_dts";
        };
    }

    /**
     * Resolves the storage-form value: for {@link AttributeType#ENUM} / {@link AttributeType#ENUM_LIST} the
     * {@code AttributeTypeValue.id} -> {@code value} translation runs through the cache; primitives pass
     * through unchanged.
     */
    private Object translateValue(AttributeType type, Object raw) {
        if (raw == null) {
            return null;
        }
        return switch (type) {
            case ENUM -> resolveEnumValue(raw.toString());
            case ENUM_LIST -> resolveEnumList(raw);
            default -> raw;
        };
    }

    private String resolveEnumValue(String valueId) {
        AttributeTypeValueDto v = cache.value(valueId);
        return v == null ? null : v.value();
    }

    private List<String> resolveEnumList(Object raw) {
        if (raw instanceof List<?> list) {
            List<String> result = new ArrayList<>(list.size());
            for (Object element : list) {
                if (element != null) {
                    String resolved = resolveEnumValue(element.toString());
                    if (resolved != null) {
                        result.add(resolved);
                    }
                }
            }
            return result;
        }
        return List.of();
    }

    /**
     * Solr {@code location_rpt} likes "lat,lon" for points; for non-points we fall back to the centroid.
     */
    private String toLatLon(Geometry geometry) {
        if (geometry == null) {
            return null;
        }
        if (geometry instanceof Point p) {
            return p.getY() + "," + p.getX();
        }
        Point centroid = geometry.getCentroid();
        return centroid == null ? null : centroid.getY() + "," + centroid.getX();
    }
}
