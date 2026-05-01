package com.osint.intelligence.server.service;

import com.osint.intelligence.server.dto.TemplateDto;
import com.osint.intelligence.server.error.EntityNotFoundException;
import com.osint.intelligence.server.repository.TemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TemplateService {

    private final TemplateRepository repository;

    public TemplateService(TemplateRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TemplateDto create(TemplateDto dto, String user) {
        return repository.insert(dto, user);
    }

    @Transactional
    public TemplateDto update(TemplateDto dto, String user) {
        return repository.update(dto, user);
    }

    @Transactional
    public void softDelete(String id, long expectedVersion, String user) {
        repository.softDelete(id, expectedVersion, user);
    }

    @Transactional(readOnly = true)
    public List<TemplateDto> findAllActive() {
        return repository.findAllActive();
    }

    @Transactional(readOnly = true)
    public TemplateDto requireById(String id) {
        // Soft-deleted rows must look gone to API consumers; the outbox path uses the repository
        // directly so it can still observe the deleted flag for Solr eviction.
        TemplateDto dto = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Template", id));
        if (dto.audit().deleted()) {
            throw new EntityNotFoundException("Template", id);
        }
        return dto;
    }
}
