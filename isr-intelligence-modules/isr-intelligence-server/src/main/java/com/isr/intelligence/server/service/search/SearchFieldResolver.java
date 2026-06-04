package com.isr.intelligence.server.service.search;

import com.isr.intelligence.model.AttributeType;
import com.isr.intelligence.server.api.dto.QueryHolder;
import com.isr.intelligence.server.dto.AttributeDto;
import com.isr.intelligence.server.dto.AttributeTypeValueDto;
import com.isr.intelligence.server.dto.TemplateDto;
import com.isr.intelligence.server.repository.TemplateRepository;
import com.isr.intelligence.server.service.AttributeCacheService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class SearchFieldResolver {

    private static final Map<String, BuiltInField> BUILT_INS = Map.ofEntries(
            Map.entry("id", new BuiltInField("id", AttributeType.STRING, "id", "id", false, false, true)),
            Map.entry("templateid", new BuiltInField("templateId", AttributeType.STRING, "template_id", "templateId", false, false, true)),
            Map.entry("header", new BuiltInField("header", AttributeType.STRING, "header", "header", true, false, true)),
            Map.entry("description", new BuiltInField("description", AttributeType.STRING, "description", "description", true, false, true)),
            Map.entry("keywords", new BuiltInField("keywords", AttributeType.STRING, "keywords", "keywords", true, false, false)),
            Map.entry("location", new BuiltInField("location", AttributeType.GEOMETRY, "location", "location", false, true, false)),
            Map.entry("creationdate", new BuiltInField("creationDate", AttributeType.DATE, "created_at", "creationDate", false, false, true)),
            Map.entry("createdat", new BuiltInField("creationDate", AttributeType.DATE, "created_at", "creationDate", false, false, true)),
            Map.entry("lastmodificationdate", new BuiltInField("lastModificationDate", AttributeType.DATE, "last_modified", "lastModificationDate", false, false, true)),
            Map.entry("lastmodified", new BuiltInField("lastModificationDate", AttributeType.DATE, "last_modified", "lastModificationDate", false, false, true)),
            Map.entry("lastquerytime", new BuiltInField("lastQueryTime", AttributeType.DATE, "last_modified", "lastModificationDate", false, false, true))
    );

    private static final Map<String, AttributeType> SUFFIX_HINTS = Map.of(
            "_txt", AttributeType.STRING,
            "_enum", AttributeType.ENUM,
            "_enums", AttributeType.ENUM_LIST,
            "_l", AttributeType.NUMBER,
            "_b", AttributeType.BOOLEAN,
            "_dt", AttributeType.DATE,
            "_dts", AttributeType.DATE_LIST,
            "_srpt", AttributeType.GEOMETRY
    );

    private final AttributeCacheService attributeCache;
    private final TemplateRepository templateRepository;

    public SearchFieldResolver(AttributeCacheService attributeCache, TemplateRepository templateRepository) {
        this.attributeCache = attributeCache;
        this.templateRepository = templateRepository;
    }

    public ResolvedSearchField resolve(String queryFieldName, String templateId) {
        if (queryFieldName == null || queryFieldName.isBlank()) {
            throw badRequest("queryFieldName is required for leaf queries");
        }

        ParsedField parsed = parse(queryFieldName);
        BuiltInField builtIn = BUILT_INS.get(parsed.baseName().toLowerCase(Locale.ROOT));
        if (builtIn != null) {
            return new ResolvedSearchField(
                    builtIn.logicalName(),
                    null,
                    builtIn.attributeType(),
                    true,
                    builtIn.pgField(),
                    builtIn.solrField(),
                    builtIn.supportsText(),
                    builtIn.supportsGeo(),
                    builtIn.supportsSort());
        }

        AttributeDto attribute = attributeCache.attributeByName(parsed.baseName());
        if (attribute == null) {
            throw badRequest("Unknown search field: " + queryFieldName);
        }
        if (parsed.hintedType() != null && !compatibleHint(attribute.attributeType(), parsed.hintedType())) {
            throw badRequest("Field suffix does not match attribute type for " + queryFieldName);
        }
        if (templateId != null && !templateId.isBlank()) {
            TemplateDto template = templateRepository.findById(templateId)
                    .orElseThrow(() -> badRequest("Unknown templateId: " + templateId));
            if (!template.attributeIdList().contains(attribute.id())) {
                throw badRequest("Attribute " + parsed.baseName() + " is not part of template " + templateId);
            }
        }

        AttributeType type = attribute.attributeType();
        return new ResolvedSearchField(
                attribute.name(),
                attribute.id(),
                type,
                false,
                "attribute_values." + attribute.id(),
                SearchFieldNames.attributeSolrField(attribute.id(), type),
                type == AttributeType.STRING,
                type == AttributeType.GEOMETRY || type == AttributeType.GEOMETRY_LIST,
                supportsSort(type));
    }

    public Object normalizeValue(ResolvedSearchField field, Object rawValue) {
        if (rawValue == null || field.builtIn()) {
            return rawValue;
        }
        if (field.attributeType() == AttributeType.ENUM) {
            return resolveEnumValue(field.attributeId(), rawValue.toString());
        }
        if (field.attributeType() == AttributeType.ENUM_LIST) {
            if (rawValue instanceof Collection<?> collection) {
                return collection.stream()
                        .map(v -> resolveEnumValue(field.attributeId(), String.valueOf(v)))
                        .toList();
            }
            return List.of(resolveEnumValue(field.attributeId(), rawValue.toString()));
        }
        return rawValue;
    }

    public String findTemplateId(List<QueryHolder> holders) {
        if (holders == null) {
            return null;
        }
        for (QueryHolder holder : holders) {
            if (holder == null) {
                continue;
            }
            if (!holder.group()
                    && holder.queryFieldName() != null
                    && holder.queryFieldName().equalsIgnoreCase("templateId")
                    && holder.queryFieldValue() != null) {
                return holder.queryFieldValue().toString();
            }
            String nested = findTemplateId(holder.nestedQueries());
            if (nested != null) {
                return nested;
            }
        }
        return null;
    }

    private String resolveEnumValue(String attributeId, String valueOrId) {
        AttributeTypeValueDto value = attributeCache.valueByAttributeAndLabel(attributeId, valueOrId);
        if (value == null) {
            throw badRequest("Unknown enum value for attribute " + attributeId + ": " + valueOrId);
        }
        return value.id();
    }

    private static ParsedField parse(String raw) {
        for (Map.Entry<String, AttributeType> entry : SUFFIX_HINTS.entrySet()) {
            if (raw.endsWith(entry.getKey()) && raw.length() > entry.getKey().length()) {
                return new ParsedField(raw.substring(0, raw.length() - entry.getKey().length()), entry.getValue());
            }
        }
        return new ParsedField(raw, null);
    }

    private static boolean compatibleHint(AttributeType actual, AttributeType hint) {
        return actual == hint || (actual == AttributeType.GEOMETRY_LIST && hint == AttributeType.GEOMETRY);
    }

    private static boolean supportsSort(AttributeType type) {
        return switch (type) {
            case STRING, NUMBER, BOOLEAN, DATE, ENUM -> true;
            case ENUM_LIST, DATE_LIST, GEOMETRY, GEOMETRY_LIST -> false;
        };
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record ParsedField(String baseName, AttributeType hintedType) {}

    private record BuiltInField(
            String logicalName,
            AttributeType attributeType,
            String pgField,
            String solrField,
            boolean supportsText,
            boolean supportsGeo,
            boolean supportsSort
    ) {}
}
