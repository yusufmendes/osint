package com.isr.auth.service;

import com.isr.auth.config.AuthProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey key;
    private final long ttlMinutes;

    public JwtService(AuthProperties props) {
        byte[] keyBytes = props.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("isr.auth.jwt-secret must be at least 32 bytes (256 bits)");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.ttlMinutes = Math.max(1, props.getJwtTtlMinutes());
    }

    public String issue(String userId, String username, List<String> permissions) {
        Instant now = Instant.now();
        Instant exp = now.plus(ttlMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(userId)
                .claim("username", username)
                .claim("permissions", permissions)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getTtlSeconds() {
        return ttlMinutes * 60L;
    }
}
