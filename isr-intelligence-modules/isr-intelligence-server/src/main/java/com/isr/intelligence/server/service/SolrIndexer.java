package com.isr.intelligence.server.service;

import com.isr.intelligence.server.dto.AttributeDto;
import com.isr.intelligence.server.dto.IntelligenceDto;
import com.isr.intelligence.server.service.search.SearchFieldNames;
import org.apache.solr.common.SolrInputDocument;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Translates an in-memory {@link IntelligenceDto} (id-keyed JSONB form) into a Solr document with the
 * same id-keyed dynamic-field form. Dynamic Solr fields are named with stable attribute ids so label/name
 * edits do not orphan old index records.
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
        // SolrJ's javabin codec doesn't understand java.time.Instant — passing one through ends up
        // serialised as the toString() form ("java.time.Instant:..."), which Solr then fails to parse
        // as a date. Hand it a java.util.Date so the codec routes it through the date binder.
        doc.setField("creationDate", toDate(dto.audit().createdAt()));
        doc.setField("lastModificationDate", toDate(dto.audit().lastModified()));
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
            String fieldName = SearchFieldNames.attributeSolrField(attr.id(), attr.attributeType());
            Object translated = translateValue(entry.getValue());
            if (translated != null) {
                doc.setField(fieldName, translated);
            }
        }
        return doc;
    }

    private Object translateValue(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof List<?> list) {
            List<String> result = new ArrayList<>(list.size());
            for (Object element : list) {
                if (element != null) {
                    result.add(element.toString());
                }
            }
            return result;
        }
        return raw;
    }

    private static Date toDate(Instant instant) {
        return instant == null ? null : Date.from(instant);
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
