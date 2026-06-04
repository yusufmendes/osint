package com.isr.auth.web;

import com.isr.auth.service.JwtService;
import com.isr.auth.service.UserStore;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
public class AuthController {

    private final UserStore userStore;
    private final JwtService jwt;

    public AuthController(UserStore userStore, JwtService jwt) {
        this.userStore = userStore;
        this.jwt = jwt;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record LoginResponse(String accessToken, long expiresIn) {}
    public record MeResponse(String userId, String username, List<String> permissions) {}

    @PostMapping("/auth/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        var user = userStore.findByUsername(req.username())
                .filter(u -> u.password().equals(req.password()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        String token = jwt.issue(user.id(), user.username(), user.permissions());
        return new LoginResponse(token, jwt.getTtlSeconds());
    }

    @GetMapping("/me")
    public MeResponse me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String username = auth.getName();
        var user = userStore.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new MeResponse(user.id(), user.username(), user.permissions());
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // MVP: client discards JWT. Blacklist is roadmap (sec. 8.8 / 12).
        return ResponseEntity.noContent().build();
    }
}
