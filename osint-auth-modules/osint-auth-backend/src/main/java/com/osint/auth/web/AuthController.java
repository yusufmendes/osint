package com.osint.auth.web;

import com.osint.auth.config.AuthConfigProperties;
import com.osint.auth.config.AuthConfigProperties.UserDef;
import com.osint.auth.jwt.JwtService;
import com.osint.auth.web.dto.LoginRequest;
import com.osint.auth.web.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthConfigProperties props;
    private final JwtService jwtService;

    public AuthController(AuthConfigProperties props, JwtService jwtService) {
        this.props = props;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        UserDef user = props.getUsers().stream()
                .filter(u -> u.getUsername().equals(req.username())
                          && u.getPassword().equals(req.password()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Gecersiz kullanici adi veya sifre"));

        String userId = "u-" + (props.getUsers().indexOf(user) + 1);
        String token = jwtService.issue(userId, user.getUsername(), user.getPermissions());
        return ResponseEntity.ok(new LoginResponse(token, jwtService.expiresInSeconds()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // MVP: client-side discard yeterli; blacklist Roadmap'te
        return ResponseEntity.noContent().build();
    }
}
