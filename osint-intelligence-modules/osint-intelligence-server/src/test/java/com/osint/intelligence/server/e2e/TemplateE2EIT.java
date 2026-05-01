package com.osint.intelligence.server.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

/**
 * E2E coverage for {@code /api/templates}.
 *
 * <p>Each scenario starts from a clean DB courtesy of {@link E2EBaseIT#cleanState()}.
 */
class TemplateE2EIT extends E2EBaseIT {

    @Test
    @DisplayName("GET /api/templates -> empty list on clean DB")
    void list_is_empty_on_clean_state() {
        given()
                .spec(rest())
                .when()
                .get("/api/templates")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    @DisplayName("POST /api/templates creates a template and returns 201")
    void create_template_returns_created() {
        Map<String, Object> body = Map.of(
                "name", "person",
                "childTemplateIdList", List.of(),
                "attributeIdList", List.of());

        String id = given()
                .spec(rest())
                .header("X-User", "alice")
                .body(body)
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("person"))
                .body("version", equalTo(0))
                .body("audit.createdBy", equalTo("alice"))
                .body("audit.modifiedBy", equalTo("alice"))
                .body("audit.deleted", equalTo(false))
                .extract().path("id");

        given()
                .spec(rest())
                .when()
                .get("/api/templates/{id}", id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id))
                .body("name", equalTo("person"));
    }

    @Test
    @DisplayName("POST /api/templates accepts a client-supplied id")
    void create_template_with_explicit_id() {
        String explicit = "tmpl-fixed";
        given()
                .spec(rest())
                .body(Map.of("id", explicit, "name", "vehicle",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of()))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .body("id", equalTo(explicit));
    }

    @Test
    @DisplayName("GET /api/templates lists active rows")
    void list_returns_active_templates_only() {
        for (String name : List.of("person", "vehicle", "asset")) {
            given()
                    .spec(rest())
                    .body(Map.of("name", name,
                            "childTemplateIdList", List.of(), "attributeIdList", List.of()))
                    .when()
                    .post("/api/templates")
                    .then()
                    .statusCode(201);
        }

        given()
                .spec(rest())
                .when()
                .get("/api/templates")
                .then()
                .statusCode(200)
                .body("$", hasSize(3))
                .body("name", org.hamcrest.Matchers.hasItems("person", "vehicle", "asset"));
    }

    @Test
    @DisplayName("PUT /api/templates/{id} updates and bumps version")
    void update_template_increments_version() {
        var created = given()
                .spec(rest())
                .body(Map.of("name", "v1",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of()))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .extract().jsonPath();
        String id = created.getString("id");
        long version = created.getLong("version");

        given()
                .spec(rest())
                .header("X-User", "bob")
                .body(Map.of("id", id, "version", version, "name", "v2",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of(),
                        "audit", created.getMap("audit")))
                .when()
                .put("/api/templates/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("v2"))
                // RestAssured's default JsonPath returns numbers as Integer (when small enough), so
                // we compare with an int matcher instead of Long to avoid Hamcrest comparing across
                // numeric types.
                .body("version", greaterThanOrEqualTo((int) (version + 1)))
                .body("audit.modifiedBy", equalTo("bob"));
    }

    @Test
    @DisplayName("PUT /api/templates/{id} with stale version -> 409")
    void update_with_stale_version_yields_conflict() {
        var created = given()
                .spec(rest())
                .body(Map.of("name", "stale-test",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of()))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .extract().jsonPath();

        String id = created.getString("id");
        long version = created.getLong("version");

        given()
                .spec(rest())
                .body(Map.of("id", id, "version", version, "name", "renamed",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of(),
                        "audit", created.getMap("audit")))
                .when()
                .put("/api/templates/{id}", id)
                .then()
                .statusCode(200);

        // Second update reuses the now-stale version -> 409.
        given()
                .spec(rest())
                .body(Map.of("id", id, "version", version, "name", "renamed-again",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of(),
                        "audit", created.getMap("audit")))
                .when()
                .put("/api/templates/{id}", id)
                .then()
                .statusCode(409);
    }

    @Test
    @DisplayName("DELETE /api/templates/{id}?version=N soft-deletes the row")
    void delete_template_returns_no_content_and_hides_from_list() {
        var created = given()
                .spec(rest())
                .body(Map.of("name", "to-delete",
                        "childTemplateIdList", List.of(), "attributeIdList", List.of()))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .extract().jsonPath();

        String id = created.getString("id");
        long version = created.getLong("version");

        given()
                .spec(rest())
                .header("X-User", "carol")
                .when()
                .delete("/api/templates/{id}?version={v}", id, version)
                .then()
                .statusCode(204);

        given()
                .spec(rest())
                .when()
                .get("/api/templates")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));

        // Lookup by id of a soft-deleted row -> 404.
        given()
                .spec(rest())
                .when()
                .get("/api/templates/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("GET /api/templates/{id} for unknown id -> 404")
    void get_unknown_template_yields_not_found() {
        given()
                .spec(rest())
                .when()
                .get("/api/templates/{id}", "does-not-exist")
                .then()
                .statusCode(404);
    }
}
