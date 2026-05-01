package com.osint.intelligence.server.api;

import com.osint.intelligence.server.api.dto.CombinedSearchRequest;
import com.osint.intelligence.server.api.dto.CombinedSearchResponse;
import com.osint.intelligence.server.api.dto.IntelligenceResponse;
import com.osint.intelligence.server.db.GeometryWkt;
import com.osint.intelligence.server.service.CombinedSearchService;
import com.osint.intelligence.server.service.IntelligenceService;
import com.osint.intelligence.server.service.SolrSearchService;
import org.apache.solr.client.solrj.response.FacetField;
import org.locationtech.jts.geom.Geometry;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/intelligence")
public class SearchController {

    private final SolrSearchService solrSearchService;
    private final CombinedSearchService combinedSearchService;
    private final IntelligenceService intelligenceService;

    public SearchController(
            SolrSearchService solrSearchService,
            CombinedSearchService combinedSearchService,
            IntelligenceService intelligenceService) {
        this.solrSearchService = solrSearchService;
        this.combinedSearchService = combinedSearchService;
        this.intelligenceService = intelligenceService;
    }

    @GetMapping("/search")
    public List<IntelligenceResponse> search(
            @RequestParam("q") String query,
            @RequestParam(value = "templateId", required = false) String templateId,
            @RequestParam(value = "rows", defaultValue = "100") int rows) throws Exception {
        Set<String> ids = solrSearchService.idsByQuerySet(query, templateId, rows);
        if (ids.isEmpty()) {
            return List.of();
        }
        return intelligenceService.findByIds(List.copyOf(ids)).stream()
                .map(IntelligenceResponse::from)
                .toList();
    }

    @GetMapping("/search/facets")
    public Map<String, Map<String, Long>> facets(
            @RequestParam(value = "templateId", required = false) String templateId,
            @RequestParam("fields") List<String> fields) throws Exception {
        List<FacetField> response = solrSearchService.facets(templateId, fields);
        Map<String, Map<String, Long>> result = new LinkedHashMap<>();
        for (FacetField ff : response) {
            Map<String, Long> bucket = new LinkedHashMap<>();
            for (FacetField.Count c : ff.getValues()) {
                bucket.put(c.getName(), c.getCount());
            }
            result.put(ff.getName(), bucket);
        }
        return result;
    }

    @PostMapping("/combined-search")
    public CombinedSearchResponse combined(@RequestBody CombinedSearchRequest body) {
        Geometry polygon = body.polygonWkt() == null || body.polygonWkt().isBlank()
                ? null
                : GeometryWkt.fromWkt(body.polygonWkt());
        var result = combinedSearchService.run(body.templateId(), body.query(), polygon);
        return new CombinedSearchResponse(
                result.records().stream().map(IntelligenceResponse::from).toList(),
                result.capped());
    }
}
