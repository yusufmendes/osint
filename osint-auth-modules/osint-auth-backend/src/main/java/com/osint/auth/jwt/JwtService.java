package com.osint.auth.jwt;

import com.osint.auth.config.AuthConfigProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

    private final AuthConfigProperties props;
    private final SecretKey signingKey;

    public JwtService(AuthConfigProperties props) {
        this.props = props;
        byte[] secretBytes = props.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("osint.auth.jwtSecret must be at least 32 bytes (HS256).");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    }

    public String issue(String userId, String username, List<String> permissions) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getJwtTtlMinutes() * 60L);
        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(Map.of(
                        "username", username,
                        "permissions", permissions
                ))
                .signWith(signingKey)
                .compact();
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long expiresInSeconds() {
        return props.getJwtTtlMinutes() * 60L;
    }
}
