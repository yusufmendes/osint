package com.isr.intelligence.server.service;

import com.isr.intelligence.server.service.search.SolrRawCommand;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.response.FacetField;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class SolrSearchService {

    private final SolrClient solrClient;

    public SolrSearchService(SolrClient solrClient) {
        this.solrClient = solrClient;
    }

    /**
     * Returns a map preserving Solr's score order, mapping intelligence id -> relevance score.
     */
    public SolrIdResult idsByCommand(SolrRawCommand command) throws Exception {
        SolrQuery query = toSolrQuery(command);
        query.setFields("id", "score");

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
        return new SolrIdResult(ordered, docs.getNumFound());
    }

    public Map<String, Map<String, Long>> facetsByCommand(SolrRawCommand command) throws Exception {
        SolrQuery query = toSolrQuery(command.withRows(0, 0));
        query.setRows(0);
        query.setFacet(true);
        query.setFacetMinCount(1);
        for (String field : command.facetLogicalNamesBySolrField().keySet()) {
            query.addFacetField(field);
        }

        QueryResponse response = solrClient.query(query);
        Map<String, Map<String, Long>> result = new LinkedHashMap<>();
        if (response.getFacetFields() == null) {
            return result;
        }
        for (FacetField facetField : response.getFacetFields()) {
            String logicalName = command.facetLogicalNamesBySolrField()
                    .getOrDefault(facetField.getName(), facetField.getName());
            Map<String, Long> bucket = new LinkedHashMap<>();
            if (facetField.getValues() != null) {
                for (FacetField.Count count : facetField.getValues()) {
                    bucket.put(count.getName(), count.getCount());
                }
            }
            result.put(logicalName, bucket);
        }
        return result;
    }

    private SolrQuery toSolrQuery(SolrRawCommand command) {
        SolrQuery query = new SolrQuery();
        query.setQuery(command.query());
        query.setStart(command.start());
        query.setRows(command.rows());
        for (String filter : command.filterQueries()) {
            query.addFilterQuery(filter);
        }
        if (!"*:*".equals(command.query())) {
            query.setParam("defType", "edismax");
            query.setParam("qf", "_text_");
            query.setParam("uf", "-*");
        }
        if (command.sortField() != null && !command.sortField().isBlank()) {
            query.setSort(command.sortField(), command.sortAsc() ? SolrQuery.ORDER.asc : SolrQuery.ORDER.desc);
        }
        return query;
    }

    public record SolrIdResult(Map<String, Float> scoresById, long total) {}
}
