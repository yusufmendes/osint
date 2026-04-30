package com.osint.auth.web;

import com.osint.auth.web.dto.MeResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping
public class MeController {

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(HttpServletRequest request) {
        String userId = (String) request.getAttribute("osint.userId");
        String username = (String) request.getAttribute("osint.username");
        @SuppressWarnings("unchecked")
        List<String> permissions = (List<String>) request.getAttribute("osint.permissions");
        if (userId == null || username == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token yok veya gecersiz");
        }
        return ResponseEntity.ok(new MeResponse(userId, username,
                permissions == null ? List.of() : permissions));
    }
}
