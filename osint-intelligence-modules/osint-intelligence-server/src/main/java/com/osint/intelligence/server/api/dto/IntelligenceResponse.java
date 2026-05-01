package com.osint.intelligence.server.api.dto;

import com.osint.intelligence.server.db.GeometryWkt;
import com.osint.intelligence.server.dto.AuditDto;
import com.osint.intelligence.server.dto.IntelligenceDto;
import org.locationtech.jts.geom.Geometry;

import java.util.List;
import java.util.Map;

public record IntelligenceResponse(
        String id,
        long version,
        String header,
        String description,
        List<String> keywords,
        List<String> attachedFileUniqueIdList,
        String locationWkt,
        List<String> relatedLocationWktList,
        String templateId,
        List<String> relatedIntelligenceIdList,
        Map<String, Object> attributeIdToAttributeValueMap,
        AuditDto audit
) {
    public static IntelligenceResponse from(IntelligenceDto dto) {
        return new IntelligenceResponse(
                dto.id(),
                dto.version(),
                dto.header(),
                dto.description(),
                dto.keywords(),
                dto.attachedFileUniqueIdList(),
                GeometryWkt.toWkt(dto.location()),
                dto.relatedLocationList().stream().map(GeometryWkt::toWkt).toList(),
                dto.templateId(),
                dto.relatedIntelligenceIdList(),
                dto.attributeIdToAttributeValueMap(),
                dto.audit());
    }

    public static IntelligenceDto toDto(CreateIntelligenceRequest req) {
        Geometry location = GeometryWkt.fromWkt(req.locationWkt());
        List<Geometry> related = req.relatedLocationWktList() == null
                ? List.of()
                : req.relatedLocationWktList().stream().map(GeometryWkt::fromWkt).toList();
        return new IntelligenceDto(
                req.id(),
                req.version() == null ? 0L : req.version(),
                req.header(),
                req.description(),
                req.keywords() == null ? List.of() : req.keywords(),
                req.attachedFileUniqueIdList() == null ? List.of() : req.attachedFileUniqueIdList(),
                location,
                related,
                req.templateId(),
                req.relatedIntelligenceIdList() == null ? List.of() : req.relatedIntelligenceIdList(),
                req.attributeIdToAttributeValueMap() == null ? Map.of() : req.attributeIdToAttributeValueMap(),
                AuditDto.initial(java.time.Instant.EPOCH, null));
    }
}
