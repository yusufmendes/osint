package com.osint.intelligence.server.service;

import com.osint.intelligence.server.config.IntelligenceProperties;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.repository.GeoQueryRepository;
import com.osint.intelligence.server.repository.IntelligenceRepository;
import org.locationtech.jts.geom.Geometry;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

/**
 * Combined search: Solr (text + dynamic attributes) and PostGIS (polygon) run in parallel; the backend
 * intersects the two id sets, hydrates from PG, and orders the result by Solr score. Edge cases per
 * Section 6.3 of the architecture document.
 */
@Service
public class CombinedSearchService {

    private final SolrSearchService solrSearchService;
    private final GeoQueryRepository geoQueryRepository;
    private final IntelligenceRepository intelligenceRepository;
    private final IntelligenceProperties properties;

    public CombinedSearchService(
            SolrSearchService solrSearchService,
            GeoQueryRepository geoQueryRepository,
            IntelligenceRepository intelligenceRepository,
            IntelligenceProperties properties) {
        this.solrSearchService = solrSearchService;
        this.geoQueryRepository = geoQueryRepository;
        this.intelligenceRepository = intelligenceRepository;
        this.properties = properties;
    }

    public Result run(String templateId, String query, Geometry polygon) {
        boolean hasText = query != null && !query.isBlank();
        boolean hasPolygon = polygon != null;
        int rowCap = properties.getCombinedSearch().getSolrRowCap();

        CompletableFuture<Map<String, Float>> solrFuture = hasText
                ? CompletableFuture.supplyAsync(() -> {
                    try {
                        return solrSearchService.idsByQuery(query, templateId, rowCap);
                    } catch (Exception e) {
                        throw new RuntimeException("Solr query failed", e);
                    }
                })
                : null;

        CompletableFuture<Set<String>> geoFuture = hasPolygon
                ? CompletableFuture.supplyAsync(() -> geoQueryRepository.withinPolygonSet(templateId, polygon))
                : null;

        Map<String, Float> solrIds;
        Set<String> geoIds;
        try {
            if (solrFuture != null && geoFuture != null) {
                CompletableFuture.allOf(solrFuture, geoFuture).get();
                solrIds = solrFuture.get();
                geoIds = geoFuture.get();
            } else if (solrFuture != null) {
                solrIds = solrFuture.get();
                geoIds = null;
            } else if (geoFuture != null) {
                solrIds = Collections.emptyMap();
                geoIds = geoFuture.get();
            } else {
                return new Result(List.of(), false);
            }
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Combined search failed", e);
        }

        Set<String> matched;
        if (hasText && hasPolygon) {
            matched = new LinkedHashSet<>(solrIds.keySet());
            matched.retainAll(geoIds);
        } else if (hasText) {
            matched = new LinkedHashSet<>(solrIds.keySet());
        } else {
            matched = new LinkedHashSet<>(geoIds);
        }

        if (matched.isEmpty()) {
            return new Result(List.of(), hasText && solrIds.size() >= rowCap);
        }

        List<IntelligenceDto> rows = intelligenceRepository.findByIds(new ArrayList<>(matched));

        if (hasText) {
            Map<String, Float> scoreMap = solrIds;
            rows = new ArrayList<>(rows);
            rows.sort((a, b) -> Float.compare(
                    scoreMap.getOrDefault(b.id(), 0f),
                    scoreMap.getOrDefault(a.id(), 0f)));
        }
        return new Result(rows, hasText && solrIds.size() >= rowCap);
    }

    public record Result(List<IntelligenceDto> records, boolean capped) {}
}
