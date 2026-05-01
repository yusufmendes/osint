package com.osint.intelligence.server.api;

import com.osint.intelligence.server.api.dto.CreateIntelligenceRequest;
import com.osint.intelligence.server.api.dto.DeltaResponse;
import com.osint.intelligence.server.api.dto.IntelligenceResponse;
import com.osint.intelligence.server.dto.IntelligenceDto;
import com.osint.intelligence.server.service.IntelligenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {

    private final IntelligenceService service;

    public IntelligenceController(IntelligenceService service) {
        this.service = service;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public DeltaResponse delta(
            @RequestParam("templateId") String templateId,
            @RequestParam(value = "lastQueryTime", required = false) Instant lastQueryTime) {
        try (Stream<IntelligenceDto> stream = service.streamDelta(templateId, lastQueryTime)) {
            var rows = stream.map(IntelligenceResponse::from).toList();
            return new DeltaResponse(rows, Instant.now());
        }
    }

    @GetMapping("/{id}")
    public IntelligenceResponse byId(@PathVariable String id) {
        return IntelligenceResponse.from(service.requireById(id));
    }

    @PostMapping
    public ResponseEntity<IntelligenceResponse> create(
            @Valid @RequestBody CreateIntelligenceRequest body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        IntelligenceDto dto = IntelligenceResponse.toDto(body);
        if (dto.id() == null || dto.id().isBlank()) {
            dto = withId(dto, UUID.randomUUID().toString());
        }
        IntelligenceDto saved = service.create(dto, user);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(IntelligenceResponse.from(saved));
    }

    @PutMapping("/{id}")
    public IntelligenceResponse update(
            @PathVariable String id,
            @Valid @RequestBody CreateIntelligenceRequest body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        IntelligenceDto dto = withId(IntelligenceResponse.toDto(body), id);
        return IntelligenceResponse.from(service.update(dto, user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String id,
            @RequestParam("version") long version,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        service.softDelete(id, version, user);
    }

    private IntelligenceDto withId(IntelligenceDto dto, String id) {
        return new IntelligenceDto(
                id, dto.version(), dto.header(), dto.description(), dto.keywords(),
                dto.attachedFileUniqueIdList(), dto.location(), dto.relatedLocationList(),
                dto.templateId(), dto.relatedIntelligenceIdList(),
                dto.attributeIdToAttributeValueMap(), dto.audit());
    }
}
