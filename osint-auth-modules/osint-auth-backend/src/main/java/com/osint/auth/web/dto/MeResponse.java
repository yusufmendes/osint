package com.osint.auth.web.dto;

import java.util.List;

public record MeResponse(String userId, String username, List<String> permissions) {}
