package com.isr.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Bound from <code>isr.auth.*</code> in application.yml.
 *
 * MVP-only: users live here, in plaintext, never in a DB. Swap-out point for
 * Keycloak/OIDC migration is a single bean - {@link com.isr.auth.service.UserStore}.
 */
@ConfigurationProperties(prefix = "isr.auth")
public class AuthProperties {

    private String jwtSecret = "change-me-please-make-this-at-least-32-bytes-long";
    private int jwtTtlMinutes = 60;
    private List<String> corsAllowedOrigins = new ArrayList<>();
    private List<DummyUser> users = new ArrayList<>();

    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }

    public int getJwtTtlMinutes() { return jwtTtlMinutes; }
    public void setJwtTtlMinutes(int jwtTtlMinutes) { this.jwtTtlMinutes = jwtTtlMinutes; }

    public List<String> getCorsAllowedOrigins() { return corsAllowedOrigins; }
    public void setCorsAllowedOrigins(List<String> corsAllowedOrigins) { this.corsAllowedOrigins = corsAllowedOrigins; }

    public List<DummyUser> getUsers() { return users; }
    public void setUsers(List<DummyUser> users) { this.users = users; }

    public static class DummyUser {
        private String username;
        private String password;
        private List<String> permissions = new ArrayList<>();

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public List<String> getPermissions() { return permissions; }
        public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    }
}
