package com.osint.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "osint.auth")
public class AuthConfigProperties {

    private String jwtSecret = "";
    private int jwtTtlMinutes = 60;
    private List<UserDef> users = new ArrayList<>();
    private Cors cors = new Cors();

    public String getJwtSecret() { return jwtSecret; }
    public void setJwtSecret(String s) { this.jwtSecret = s; }

    public int getJwtTtlMinutes() { return jwtTtlMinutes; }
    public void setJwtTtlMinutes(int v) { this.jwtTtlMinutes = v; }

    public List<UserDef> getUsers() { return users; }
    public void setUsers(List<UserDef> users) { this.users = users; }

    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }

    public static class UserDef {
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

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();
        public List<String> getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(List<String> v) { this.allowedOrigins = v; }
    }
}
