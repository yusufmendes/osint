package com.osint.intelligence.server.api;

import com.osint.intelligence.server.dto.TemplateDto;
import com.osint.intelligence.server.service.TemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.osint.intelligence.server.dto.AuditDto;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateDto> all() {
        return templateService.findAllActive();
    }

    @GetMapping("/{id}")
    public TemplateDto byId(@PathVariable String id) {
        return templateService.requireById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateDto create(
            @RequestBody TemplateDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        TemplateDto seed = new TemplateDto(
                body.id() == null || body.id().isBlank() ? UUID.randomUUID().toString() : body.id(),
                0L,
                body.name(),
                body.childTemplateIdList() == null ? List.of() : body.childTemplateIdList(),
                body.attributeIdList() == null ? List.of() : body.attributeIdList(),
                AuditDto.initial(Instant.EPOCH, null));
        return templateService.create(seed, user);
    }

    @PutMapping("/{id}")
    public TemplateDto update(
            @PathVariable String id,
            @RequestBody TemplateDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        TemplateDto dto = new TemplateDto(
                id, body.version(), body.name(), body.childTemplateIdList(), body.attributeIdList(), body.audit());
        return templateService.update(dto, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String id,
            @RequestParam("version") long version,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        templateService.softDelete(id, version, user);
    }
}
