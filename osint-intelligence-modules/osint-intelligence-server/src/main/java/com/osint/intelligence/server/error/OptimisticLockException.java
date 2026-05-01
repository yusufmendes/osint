package com.osint.intelligence.server.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class OptimisticLockException extends RuntimeException {
    public OptimisticLockException(String entity, String id, long expectedVersion) {
        super("Optimistic lock failure on " + entity + " id=" + id + " expectedVersion=" + expectedVersion);
    }
}
