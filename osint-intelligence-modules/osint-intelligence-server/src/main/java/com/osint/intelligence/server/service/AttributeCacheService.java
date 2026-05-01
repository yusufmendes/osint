package com.osint.intelligence.server.service;

import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.repository.AttributeRepository;
import com.osint.intelligence.server.repository.AttributeTypeValueRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Lazy in-process cache for {@link AttributeDto} and {@link AttributeTypeValueDto} lookups used by the
 * outbox worker (id -> name translation). The cache reloads on demand and on writer signals.
 *
 * <p>For MVP we accept full-table reloads — both tables are tiny relative to {@code intelligence}.</p>
 */
@Service
public class AttributeCacheService {

    private final AttributeRepository attributeRepository;
    private final AttributeTypeValueRepository attributeTypeValueRepository;

    private final AtomicLong attributesGeneration = new AtomicLong();
    private final AtomicLong valuesGeneration = new AtomicLong();

    private volatile Map<String, AttributeDto> attributesById = Map.of();
    private volatile Map<String, AttributeTypeValueDto> valuesById = Map.of();

    public AttributeCacheService(
            AttributeRepository attributeRepository,
            AttributeTypeValueRepository attributeTypeValueRepository) {
        this.attributeRepository = attributeRepository;
        this.attributeTypeValueRepository = attributeTypeValueRepository;
    }

    public AttributeDto attribute(String id) {
        AttributeDto cached = attributesById.get(id);
        if (cached != null) {
            return cached;
        }
        return reloadAttributesAndGet(id);
    }

    public AttributeTypeValueDto value(String id) {
        AttributeTypeValueDto cached = valuesById.get(id);
        if (cached != null) {
            return cached;
        }
        return reloadValuesAndGet(id);
    }

    public void invalidateAttributes() { attributesGeneration.incrementAndGet(); attributesById = Map.of(); }
    public void invalidateValues() { valuesGeneration.incrementAndGet(); valuesById = Map.of(); }

    private synchronized AttributeDto reloadAttributesAndGet(String id) {
        if (attributesById.containsKey(id)) {
            return attributesById.get(id);
        }
        Map<String, AttributeDto> reloaded = attributeRepository.findAllActive().stream()
                .collect(Collectors.toMap(AttributeDto::id, a -> a, (a, b) -> b, ConcurrentHashMap::new));
        attributesById = reloaded;
        return reloaded.get(id);
    }

    private synchronized AttributeTypeValueDto reloadValuesAndGet(String id) {
        if (valuesById.containsKey(id)) {
            return valuesById.get(id);
        }
        Map<String, AttributeTypeValueDto> reloaded = attributeTypeValueRepository.findAllActive().stream()
                .collect(Collectors.toMap(AttributeTypeValueDto::id, v -> v, (a, b) -> b, ConcurrentHashMap::new));
        valuesById = reloaded;
        return reloaded.get(id);
    }
}
