package com.osint.intelligence.server.e2e;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

/**
 * E2E coverage for {@code /api/intelligence} CRUD, byId, and delta endpoints.
 */
class IntelligenceE2EIT extends E2EBaseIT {

    @Test
    @DisplayName("POST /api/intelligence -> 202 ACCEPTED with id and version")
    void create_intelligence_returns_accepted() {
        String templateId = createTemplate("person");

        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("header", "First sighting");
        body.put("description", "Subject spotted near the bridge");
        body.put("keywords", List.of("kw1", "kw2"));
        body.put("attachedFileUniqueIdList", List.of());
        body.put("locationWkt", "POINT(28.9784 41.0082)");
        body.put("relatedLocationWktList", List.of("POINT(29.0 41.0)"));
        body.put("relatedIntelligenceIdList", List.of());
        body.put("attributeIdToAttributeValueMap", Map.of());

        var created = given()
                .spec(rest())
                .header("X-User", "alice")
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(202)
                .body("id", notNullValue())
                .body("version", equalTo(0))
                .body("templateId", equalTo(templateId))
                .body("header", equalTo("First sighting"))
                .body("description", equalTo("Subject spotted near the bridge"))
                .body("keywords", containsInAnyOrder("kw1", "kw2"))
                .body("locationWkt", notNullValue())
                .body("audit.createdBy", equalTo("alice"))
                .body("audit.modifiedBy", equalTo("alice"))
                .extract().jsonPath();

        // GET by id round-trips the same payload.
        given()
                .spec(rest())
                .when()
                .get("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(200)
                .body("id", equalTo(created.getString("id")))
                .body("header", equalTo("First sighting"))
                .body("relatedLocationWktList", hasSize(1));
    }

    @Test
    @DisplayName("POST /api/intelligence accepts client-supplied id")
    void create_with_explicit_id() {
        String templateId = createTemplate("person");
        String clientId = "intel-fixed-001";

        Map<String, Object> body = baseBody(templateId, "Fixed", null);
        body.put("id", clientId);

        given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(202)
                .body("id", equalTo(clientId));
    }

    @Test
    @DisplayName("POST /api/intelligence with missing templateId -> 400")
    void create_without_template_id_is_rejected() {
        Map<String, Object> body = new HashMap<>();
        body.put("header", "no template");
        // templateId missing entirely; @NotBlank kicks in.
        given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("PUT /api/intelligence/{id} updates fields and bumps version")
    void update_intelligence_increments_version() {
        String templateId = createTemplate("person");
        var created = postIntel(templateId, "v1", "POINT(0 0)");

        Map<String, Object> body = baseBody(templateId, "v2", "POINT(1 1)");
        body.put("id", created.getString("id"));
        body.put("version", created.getLong("version"));

        given()
                .spec(rest())
                .header("X-User", "bob")
                .body(body)
                .when()
                .put("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(200)
                .body("header", equalTo("v2"))
                .body("version", greaterThanOrEqualTo((int) (created.getLong("version") + 1)))
                .body("audit.modifiedBy", equalTo("bob"));
    }

    @Test
    @DisplayName("PUT /api/intelligence/{id} with stale version -> 409")
    void update_with_stale_version_yields_conflict() {
        String templateId = createTemplate("person");
        var created = postIntel(templateId, "v1", null);
        long version = created.getLong("version");

        Map<String, Object> firstUpdate = baseBody(templateId, "v2", null);
        firstUpdate.put("id", created.getString("id"));
        firstUpdate.put("version", version);

        given()
                .spec(rest())
                .body(firstUpdate)
                .when()
                .put("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(200);

        // Reuse stale version -> conflict.
        given()
                .spec(rest())
                .body(firstUpdate)
                .when()
                .put("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(409);
    }

    @Test
    @DisplayName("DELETE /api/intelligence/{id}?version=N soft-deletes the row")
    void delete_intelligence_returns_no_content() {
        String templateId = createTemplate("person");
        var created = postIntel(templateId, "to-delete", null);

        given()
                .spec(rest())
                .when()
                .delete("/api/intelligence/{id}?version={v}",
                        created.getString("id"), created.getLong("version"))
                .then()
                .statusCode(204);

        given()
                .spec(rest())
                .when()
                .get("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("GET /api/intelligence/{id} unknown -> 404")
    void unknown_intelligence_yields_not_found() {
        given()
                .spec(rest())
                .when()
                .get("/api/intelligence/{id}", "missing-intel")
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("GET /api/intelligence?templateId=&lastQueryTime= returns delta")
    void delta_returns_records_and_server_time() {
        String templateId = createTemplate("person");
        Instant before = Instant.now().minusSeconds(3600);

        postIntel(templateId, "alpha", null);
        postIntel(templateId, "beta", null);
        postIntel(templateId, "gamma", null);

        given()
                .spec(rest())
                .queryParam("templateId", templateId)
                .queryParam("lastQueryTime", before.toString())
                .when()
                .get("/api/intelligence")
                .then()
                .statusCode(200)
                .body("records", hasSize(3))
                .body("records.header", containsInAnyOrder("alpha", "beta", "gamma"))
                .body("serverTime", notNullValue());
    }

    @Test
    @DisplayName("GET /api/intelligence with future lastQueryTime returns empty records")
    void delta_with_future_threshold_is_empty() {
        String templateId = createTemplate("person");
        postIntel(templateId, "alpha", null);

        given()
                .spec(rest())
                .queryParam("templateId", templateId)
                .queryParam("lastQueryTime", Instant.now().plusSeconds(3600).toString())
                .when()
                .get("/api/intelligence")
                .then()
                .statusCode(200)
                .body("records", hasSize(0));
    }

    @Test
    @DisplayName("GET /api/intelligence without lastQueryTime returns full active set")
    void delta_without_threshold_returns_full_set() {
        String templateId = createTemplate("person");
        String otherTemplate = createTemplate("vehicle");

        postIntel(templateId, "person-1", null);
        postIntel(templateId, "person-2", null);
        postIntel(otherTemplate, "car-1", null);

        // Records are scoped by templateId.
        given()
                .spec(rest())
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence")
                .then()
                .statusCode(200)
                .body("records", hasSize(2))
                .body("records.header", containsInAnyOrder("person-1", "person-2"));
    }

    // ---------- helpers ---------------------------------------------------------------

    private String createTemplate(String name) {
        return given()
                .spec(rest())
                .body(Map.of("name", name,
                        "childTemplateIdList", List.of(),
                        "attributeIdList", List.of()))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private JsonPath postIntel(String templateId, String header, String wkt) {
        Map<String, Object> body = baseBody(templateId, header, wkt);
        return given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(202)
                .extract().jsonPath();
    }

    private Map<String, Object> baseBody(String templateId, String header, String wkt) {
        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("header", header);
        body.put("description", null);
        body.put("keywords", List.of());
        body.put("attachedFileUniqueIdList", List.of());
        body.put("locationWkt", wkt);
        body.put("relatedLocationWktList", List.of());
        body.put("relatedIntelligenceIdList", List.of());
        body.put("attributeIdToAttributeValueMap", Map.of());
        return body;
    }
}
