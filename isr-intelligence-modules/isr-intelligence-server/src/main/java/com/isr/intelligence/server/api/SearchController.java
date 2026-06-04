package com.isr.intelligence.server.api;

import com.isr.intelligence.server.api.dto.SearchQuery;
import com.isr.intelligence.server.api.dto.SearchResult;
import com.isr.intelligence.server.service.GenericSearchService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/intelligence")
public class SearchController {

    private final GenericSearchService genericSearchService;

    public SearchController(GenericSearchService genericSearchService) {
        this.genericSearchService = genericSearchService;
    }

    @PostMapping("/search")
    public SearchResult search(@RequestBody SearchQuery searchQuery) {
        return genericSearchService.searchQuery(searchQuery);
    }
}
