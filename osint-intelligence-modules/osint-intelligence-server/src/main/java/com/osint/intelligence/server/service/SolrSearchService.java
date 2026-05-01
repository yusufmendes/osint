package com.osint.intelligence.server.service;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.response.FacetField;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SolrSearchService {

    private final SolrClient solrClient;

    public SolrSearchService(SolrClient solrClient) {
        this.solrClient = solrClient;
    }

    /**
     * Returns a map preserving Solr's score order, mapping intelligence id -> relevance score.
     */
    public Map<String, Float> idsByQuery(String q, String templateId, int rows) throws Exception {
        SolrQuery query = new SolrQuery();
        query.setQuery(q == null || q.isBlank() ? "*:*" : q);
        if (templateId != null && !templateId.isBlank()) {
            query.addFilterQuery("templateId:\"" + escape(templateId) + "\"");
        }
        query.setFields("id", "score");
        query.setRows(rows);

        QueryResponse response = solrClient.query(query);
        SolrDocumentList docs = response.getResults();
        Map<String, Float> ordered = new LinkedHashMap<>(docs.size());
        for (SolrDocument doc : docs) {
            String id = (String) doc.getFieldValue("id");
            Float score = (Float) doc.getFieldValue("score");
            if (id != null) {
                ordered.put(id, score == null ? 0f : score);
            }
        }
        return ordered;
    }

    public Set<String> idsByQuerySet(String q, String templateId, int rows) throws Exception {
        return new LinkedHashSet<>(idsByQuery(q, templateId, rows).keySet());
    }

    public List<FacetField> facets(String templateId, List<String> facetFields) throws Exception {
        SolrQuery query = new SolrQuery();
        query.setQuery("*:*");
        if (templateId != null && !templateId.isBlank()) {
            query.addFilterQuery("templateId:\"" + escape(templateId) + "\"");
        }
        query.setRows(0);
        query.setFacet(true);
        query.setFacetMinCount(1);
        for (String f : facetFields) {
            query.addFacetField(f);
        }
        return solrClient.query(query).getFacetFields();
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
