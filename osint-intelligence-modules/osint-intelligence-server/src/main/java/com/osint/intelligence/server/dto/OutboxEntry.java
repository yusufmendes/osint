package com.osint.intelligence.server.dto;

import java.time.Instant;

public record OutboxEntry(
        long id,
        OutboxEntityType entityType,
        String entityId,
        OutboxOp op,
        Instant createdAt,
        Instant processedAt,
        int attemptCount,
        String lastError
) {}
