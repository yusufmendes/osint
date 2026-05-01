package com.osint.intelligence.server.api;

import com.osint.intelligence.server.api.dto.IntelligenceResponse;
import com.osint.intelligence.server.api.dto.WithinPolygonRequest;
import com.osint.intelligence.server.db.GeometryWkt;
import com.osint.intelligence.server.repository.GeoQueryRepository;
import com.osint.intelligence.server.service.IntelligenceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/intelligence")
public class GeoController {

    private final GeoQueryRepository geoQueryRepository;
    private final IntelligenceService intelligenceService;

    public GeoController(
            GeoQueryRepository geoQueryRepository,
            IntelligenceService intelligenceService) {
        this.geoQueryRepository = geoQueryRepository;
        this.intelligenceService = intelligenceService;
    }

    @PostMapping("/within-polygon")
    public List<IntelligenceResponse> withinPolygon(@Valid @RequestBody WithinPolygonRequest body) {
        List<String> ids = geoQueryRepository.withinPolygon(
                body.templateId(),
                GeometryWkt.fromWkt(body.polygonWkt()));
        return intelligenceService.findByIds(ids).stream().map(IntelligenceResponse::from).toList();
    }

    @GetMapping("/near")
    public List<IntelligenceResponse> near(
            @RequestParam(value = "templateId", required = false) String templateId,
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            @RequestParam("km") double km) {
        List<String> ids = geoQueryRepository.nearby(templateId, lat, lon, km);
        return intelligenceService.findByIds(ids).stream().map(IntelligenceResponse::from).toList();
    }
}
