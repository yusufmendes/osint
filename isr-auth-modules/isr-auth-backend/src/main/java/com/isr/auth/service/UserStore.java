package com.isr.auth.service;

import com.isr.auth.config.AuthProperties;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * MVP user lookup. Reads dummy users from application.yml. The single
 * {@link #findByUsername(String)} surface is what swaps with a Keycloak / DB
 * implementation later (see Roadmap section 12).
 */
@Service
public class UserStore {

    public record User(String id, String username, String password, List<String> permissions) {}

    private final Map<String, User> byUsername = new HashMap<>();

    public UserStore(AuthProperties props) {
        int idx = 0;
        for (var u : props.getUsers()) {
            idx++;
            String id = "u-" + idx;
            byUsername.put(u.getUsername(), new User(id, u.getUsername(), u.getPassword(), List.copyOf(u.getPermissions())));
        }
    }

    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(byUsername.get(username));
    }
}
