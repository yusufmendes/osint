package com.isr.intelligence.server.service;

import com.isr.intelligence.server.api.dto.IntelligenceResponse;
import com.isr.intelligence.server.api.dto.SearchQuery;
import com.isr.intelligence.server.api.dto.SearchResult;
import com.isr.intelligence.server.config.IntelligenceProperties;
import com.isr.intelligence.server.dto.IntelligenceDto;
import com.isr.intelligence.server.repository.IntelligenceRepository;
import com.isr.intelligence.server.service.SolrSearchService.SolrIdResult;
import com.isr.intelligence.server.service.search.PostgresSearchQuery;
import com.isr.intelligence.server.service.search.SearchQueryToPostgresQuery;
import com.isr.intelligence.server.service.search.SearchQueryToSolrRawCommand;
import com.isr.intelligence.server.service.search.SolrRawCommand;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

@Service
public class GenericSearchService {

    private final SearchQueryToPostgresQuery postgresConverter;
    private final SearchQueryToSolrRawCommand solrConverter;
    private final SolrSearchService solrSearchService;
    private final IntelligenceRepository intelligenceRepository;
    private final IntelligenceProperties properties;

    public GenericSearchService(
            SearchQueryToPostgresQuery postgresConverter,
            SearchQueryToSolrRawCommand solrConverter,
            SolrSearchService solrSearchService,
            IntelligenceRepository intelligenceRepository,
            IntelligenceProperties properties) {
        this.postgresConverter = postgresConverter;
        this.solrConverter = solrConverter;
        this.solrSearchService = solrSearchService;
        this.intelligenceRepository = intelligenceRepository;
        this.properties = properties;
    }

    public SearchResult searchQuery(SearchQuery query) {
        PostgresSearchQuery postgresQuery = postgresConverter.convert(query);
        SolrRawCommand solrCommand = solrConverter.convert(query);

        SearchRows rows = query.q().isBlank()
                ? postgresOnly(postgresQuery)
                : textSearch(query, postgresQuery, solrCommand);

        Map<String, Map<String, Long>> facets = facets(query, postgresQuery, solrCommand, rows.matchingIds());
        return new SearchResult(
                rows.records().stream().map(IntelligenceResponse::from).toList(),
                facets,
                query.page(),
                query.row(),
                rows.total(),
                rows.capped());
    }

    private SearchRows postgresOnly(PostgresSearchQuery query) {
        List<IntelligenceDto> records = intelligenceRepository.search(query);
        return new SearchRows(records, intelligenceRepository.count(query.condition()), false, null);
    }

    private SearchRows textSearch(SearchQuery query, PostgresSearchQuery postgresQuery, SolrRawCommand solrCommand) {
        if (solrCommand.filtersComplete()) {
            SolrIdResult page = solrIds(solrCommand.withRows(query.offset(), query.row()));
            return new SearchRows(
                    hydrateInOrder(new ArrayList<>(page.scoresById().keySet())),
                    page.total(),
                    false,
                    null);
        }

        int rowCap = properties.getSearch().getSolrRowCap();
        CompletableFuture<SolrIdResult> solrFuture = CompletableFuture.supplyAsync(
                () -> solrIds(solrCommand.withRows(0, rowCap)));
        CompletableFuture<List<String>> pgFuture = CompletableFuture.supplyAsync(
                () -> intelligenceRepository.findIds(postgresQuery.condition()));

        SolrIdResult solrResult = join(solrFuture);
        HashSet<String> pgIds = new HashSet<>(join(pgFuture));
        List<String> matchedIds = solrResult.scoresById().keySet().stream()
                .filter(pgIds::contains)
                .toList();

        List<String> pageIds = matchedIds.stream()
                .skip(query.offset())
                .limit(query.row())
                .toList();
        return new SearchRows(
                hydrateInOrder(pageIds),
                matchedIds.size(),
                solrResult.total() > rowCap,
                matchedIds);
    }

    private Map<String, Map<String, Long>> facets(
            SearchQuery query,
            PostgresSearchQuery postgresQuery,
            SolrRawCommand solrCommand,
            List<String> matchingIds) {
        if (query.facetFields().isEmpty()) {
            return Map.of();
        }
        SolrRawCommand facetCommand = solrCommand;
        if (query.q().isBlank()) {
            facetCommand = facetCommand.withIdFilter(intelligenceRepository.findIds(postgresQuery.condition()));
        } else if (!solrCommand.filtersComplete()) {
            facetCommand = facetCommand.withIdFilter(matchingIds == null ? List.of() : matchingIds);
        }
        try {
            return solrSearchService.facetsByCommand(facetCommand);
        } catch (Exception e) {
            throw new IllegalStateException("Solr facets failed", e);
        }
    }

    private SolrIdResult solrIds(SolrRawCommand command) {
        try {
            return solrSearchService.idsByCommand(command);
        } catch (Exception e) {
            throw new IllegalStateException("Solr search failed", e);
        }
    }

    private List<IntelligenceDto> hydrateInOrder(List<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<String, IntelligenceDto> byId = new LinkedHashMap<>();
        for (IntelligenceDto dto : intelligenceRepository.findByIds(ids)) {
            if (!dto.audit().deleted()) {
                byId.put(dto.id(), dto);
            }
        }
        List<IntelligenceDto> result = new ArrayList<>(ids.size());
        for (String id : ids) {
            IntelligenceDto dto = byId.get(id);
            if (dto != null) {
                result.add(dto);
            }
        }
        return result;
    }

    private static <T> T join(CompletableFuture<T> future) {
        try {
            return future.join();
        } catch (CompletionException e) {
            if (e.getCause() instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw e;
        }
    }

    private record SearchRows(
            List<IntelligenceDto> records,
            long total,
            boolean capped,
            List<String> matchingIds
    ) {}
}
