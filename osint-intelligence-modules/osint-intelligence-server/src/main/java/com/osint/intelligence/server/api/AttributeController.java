package com.osint.intelligence.server.api;

import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.service.AttributeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attributes")
public class AttributeController {

    private final AttributeService service;

    public AttributeController(AttributeService service) {
        this.service = service;
    }

    @GetMapping
    public List<AttributeDto> all() {
        return service.findAllActive();
    }

    @GetMapping("/{id}")
    public AttributeDto byId(@PathVariable String id) {
        return service.requireAttribute(id);
    }

    @GetMapping("/{id}/values")
    public List<AttributeTypeValueDto> values(@PathVariable String id) {
        return service.findValuesForAttribute(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttributeDto create(
            @RequestBody AttributeDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        AttributeDto seed = new AttributeDto(
                body.id() == null || body.id().isBlank() ? UUID.randomUUID().toString() : body.id(),
                0L,
                body.name(),
                body.attributeType(),
                body.attributeValueTypeIdList() == null ? List.of() : body.attributeValueTypeIdList(),
                AuditDto.initial(Instant.EPOCH, null));
        return service.createAttribute(seed, user);
    }

    @PutMapping("/{id}")
    public AttributeDto update(
            @PathVariable String id,
            @RequestBody AttributeDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        AttributeDto dto = new AttributeDto(id, body.version(), body.name(), body.attributeType(),
                body.attributeValueTypeIdList(), body.audit());
        return service.updateAttribute(dto, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String id,
            @RequestParam("version") long version,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        service.softDeleteAttribute(id, version, user);
    }

    // ----- attribute_type_value -----------------------------------------------------------------

    @PostMapping("/{attributeId}/values")
    @ResponseStatus(HttpStatus.CREATED)
    public AttributeTypeValueDto createValue(
            @PathVariable String attributeId,
            @RequestBody AttributeTypeValueDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        AttributeTypeValueDto seed = new AttributeTypeValueDto(
                body.id() == null || body.id().isBlank() ? UUID.randomUUID().toString() : body.id(),
                0L,
                body.value(),
                attributeId,
                AuditDto.initial(Instant.EPOCH, null));
        return service.createValue(seed, user);
    }

    @PutMapping("/values/{valueId}")
    public AttributeTypeValueDto updateValue(
            @PathVariable String valueId,
            @RequestBody AttributeTypeValueDto body,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        AttributeTypeValueDto dto = new AttributeTypeValueDto(
                valueId, body.version(), body.value(), body.attributeId(), body.audit());
        return service.updateValue(dto, user);
    }

    @DeleteMapping("/values/{valueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteValue(
            @PathVariable String valueId,
            @RequestParam("version") long version,
            @RequestHeader(value = "X-User", defaultValue = "system") String user) {
        service.softDeleteValue(valueId, version, user);
    }
}
