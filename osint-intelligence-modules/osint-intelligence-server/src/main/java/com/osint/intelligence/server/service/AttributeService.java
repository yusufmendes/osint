package com.osint.intelligence.server.service;

import com.osint.intelligence.server.dto.AttributeDto;
import com.osint.intelligence.server.dto.AttributeTypeValueDto;
import com.osint.intelligence.server.error.EntityNotFoundException;
import com.osint.intelligence.server.repository.AttributeRepository;
import com.osint.intelligence.server.repository.AttributeTypeValueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AttributeService {

    private final AttributeRepository attributeRepository;
    private final AttributeTypeValueRepository valueRepository;
    private final AttributeCacheService cache;

    public AttributeService(
            AttributeRepository attributeRepository,
            AttributeTypeValueRepository valueRepository,
            AttributeCacheService cache) {
        this.attributeRepository = attributeRepository;
        this.valueRepository = valueRepository;
        this.cache = cache;
    }

    @Transactional
    public AttributeDto createAttribute(AttributeDto dto, String user) {
        AttributeDto saved = attributeRepository.insert(dto, user);
        cache.invalidateAttributes();
        return saved;
    }

    @Transactional
    public AttributeDto updateAttribute(AttributeDto dto, String user) {
        AttributeDto saved = attributeRepository.update(dto, user);
        cache.invalidateAttributes();
        return saved;
    }

    @Transactional
    public void softDeleteAttribute(String id, long expectedVersion, String user) {
        attributeRepository.softDelete(id, expectedVersion, user);
        cache.invalidateAttributes();
    }

    @Transactional(readOnly = true)
    public AttributeDto requireAttribute(String id) {
        return attributeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Attribute", id));
    }

    @Transactional(readOnly = true)
    public List<AttributeDto> findAllActive() {
        return attributeRepository.findAllActive();
    }

    @Transactional
    public AttributeTypeValueDto createValue(AttributeTypeValueDto dto, String user) {
        AttributeTypeValueDto saved = valueRepository.insert(dto, user);
        cache.invalidateValues();
        return saved;
    }

    @Transactional
    public AttributeTypeValueDto updateValue(AttributeTypeValueDto dto, String user) {
        AttributeTypeValueDto saved = valueRepository.update(dto, user);
        cache.invalidateValues();
        return saved;
    }

    @Transactional
    public void softDeleteValue(String id, long expectedVersion, String user) {
        valueRepository.softDelete(id, expectedVersion, user);
        cache.invalidateValues();
    }

    @Transactional(readOnly = true)
    public AttributeTypeValueDto requireValue(String id) {
        return valueRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("AttributeTypeValue", id));
    }

    @Transactional(readOnly = true)
    public List<AttributeTypeValueDto> findValuesForAttribute(String attributeId) {
        return valueRepository.findByAttributeId(attributeId);
    }
}
