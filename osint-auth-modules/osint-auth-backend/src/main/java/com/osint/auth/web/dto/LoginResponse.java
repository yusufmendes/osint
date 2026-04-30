package com.osint.auth.web.dto;

public record LoginResponse(String accessToken, long expiresIn) {}
