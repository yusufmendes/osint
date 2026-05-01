package com.osint.intelligence.server.dto;

import java.time.Instant;

/**
 * Common audit + soft-delete payload mirrored on every entity DTO.
 */
public record AuditDto(
        Instant createdAt,
        String createdBy,
        Instant lastModified,
        String modifiedBy,
        boolean deleted,
        Instant deletedAt,
        String deletedBy
) {
    public static AuditDto initial(Instant now, String user) {
        return new AuditDto(now, user, now, user, false, null, null);
    }

    public AuditDto withModification(Instant now, String user) {
        return new AuditDto(createdAt, createdBy, now, user, deleted, deletedAt, deletedBy);
    }

    public AuditDto withSoftDelete(Instant now, String user) {
        return new AuditDto(createdAt, createdBy, now, user, true, now, user);
    }
}
