package com.isr.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end auth test driven by JDK 21 java.net.http (no MockMvc / no
 * TestRestTemplate). Spring Boot 4 restructured both, so this keeps the test
 * dependency surface minimal.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthFlowTest {

    @LocalServerPort int port;

    private final ObjectMapper json = new ObjectMapper();

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    @Test
    void admin_login_then_me_returns_full_permissions() throws Exception {
        var loginReq = HttpRequest.newBuilder(uri("/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .build();
        HttpResponse<String> loginRes = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
        assertThat(loginRes.statusCode()).isEqualTo(200);
        JsonNode tree = json.readTree(loginRes.body());
        String token = tree.get("accessToken").asText();
        assertThat(token).isNotBlank();

        var meReq = HttpRequest.newBuilder(uri("/me"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> meRes = client.send(meReq, HttpResponse.BodyHandlers.ofString());
        assertThat(meRes.statusCode()).isEqualTo(200);
        JsonNode me = json.readTree(meRes.body());
        assertThat(me.get("username").asText()).isEqualTo("admin");
        assertThat(me.get("permissions").toString()).contains("intelligence.crud.view");
    }

    @Test
    void wrong_password_returns_401() throws Exception {
        var req = HttpRequest.newBuilder(uri("/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"username\":\"admin\",\"password\":\"WRONG\"}"))
                .build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertThat(res.statusCode()).isEqualTo(401);
    }

    @Test
    void me_without_token_returns_401() throws Exception {
        var req = HttpRequest.newBuilder(uri("/me")).GET().build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        assertThat(res.statusCode()).isEqualTo(401);
    }
}
