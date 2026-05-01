package com.osint.intelligence.server.e2e;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

/**
 * E2E coverage for {@code /api/attributes} and the nested {@code /values} endpoints.
 */
class AttributeE2EIT extends E2EBaseIT {

    @Test
    @DisplayName("GET /api/attributes -> empty on clean DB")
    void empty_when_clean() {
        given()
                .spec(rest())
                .when()
                .get("/api/attributes")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    @DisplayName("POST /api/attributes creates a STRING attribute and returns 201")
    void create_attribute_returns_created() {
        String id = given()
                .spec(rest())
                .header("X-User", "alice")
                .body(Map.of(
                        "name", "nickname",
                        "attributeType", "STRING",
                        "attributeValueTypeIdList", List.of()))
                .when()
                .post("/api/attributes")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("nickname"))
                .body("attributeType", equalTo("STRING"))
                .body("version", equalTo(0))
                .body("audit.createdBy", equalTo("alice"))
                .extract().path("id");

        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}", id)
                .then()
                .statusCode(200)
                .body("id", equalTo(id));
    }

    @Test
    @DisplayName("GET /api/attributes lists active rows")
    void list_returns_only_active_attributes() {
        for (Map.Entry<String, String> e : Map.of(
                "color", "STRING",
                "weight", "NUMBER",
                "active", "BOOLEAN").entrySet()) {
            given()
                    .spec(rest())
                    .body(Map.of(
                            "name", e.getKey(),
                            "attributeType", e.getValue(),
                            "attributeValueTypeIdList", List.of()))
                    .when()
                    .post("/api/attributes")
                    .then()
                    .statusCode(201);
        }

        given()
                .spec(rest())
                .when()
                .get("/api/attributes")
                .then()
                .statusCode(200)
                .body("$", hasSize(3))
                .body("name", containsInAnyOrder("color", "weight", "active"));
    }

    @Test
    @DisplayName("PUT /api/attributes/{id} updates fields")
    void update_attribute_renames_and_bumps_version() {
        var created = createAttribute("status", "STRING");

        given()
                .spec(rest())
                .header("X-User", "bob")
                .body(Map.of(
                        "id", created.getString("id"),
                        "version", created.getLong("version"),
                        "name", "status-renamed",
                        "attributeType", "STRING",
                        "attributeValueTypeIdList", List.of(),
                        "audit", created.getMap("audit")))
                .when()
                .put("/api/attributes/{id}", created.getString("id"))
                .then()
                .statusCode(200)
                .body("name", equalTo("status-renamed"))
                .body("version", greaterThanOrEqualTo((int) (created.getLong("version") + 1)))
                .body("audit.modifiedBy", equalTo("bob"));
    }

    @Test
    @DisplayName("DELETE /api/attributes/{id} soft-deletes and removes from list")
    void soft_delete_attribute_returns_no_content() {
        var created = createAttribute("ephemeral", "STRING");
        String id = created.getString("id");
        long version = created.getLong("version");

        given()
                .spec(rest())
                .when()
                .delete("/api/attributes/{id}?version={v}", id, version)
                .then()
                .statusCode(204);

        given()
                .spec(rest())
                .when()
                .get("/api/attributes")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));

        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("GET /api/attributes/{id} unknown -> 404")
    void unknown_attribute_yields_not_found() {
        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}", "missing")
                .then()
                .statusCode(404);
    }

    // ---------- /values ----------------------------------------------------------------

    @Test
    @DisplayName("POST /api/attributes/{id}/values + GET returns the values for an enum attribute")
    void create_and_list_attribute_values() {
        var attr = createAttribute("gender", "ENUM");
        String attrId = attr.getString("id");

        for (String label : List.of("MALE", "FEMALE", "OTHER")) {
            given()
                    .spec(rest())
                    .body(Map.of("value", label, "attributeId", attrId))
                    .when()
                    .post("/api/attributes/{id}/values", attrId)
                    .then()
                    .statusCode(201)
                    .body("value", equalTo(label))
                    .body("attributeId", equalTo(attrId))
                    .body("version", equalTo(0));
        }

        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}/values", attrId)
                .then()
                .statusCode(200)
                .body("$", hasSize(3))
                .body("value", containsInAnyOrder("MALE", "FEMALE", "OTHER"));
    }

    @Test
    @DisplayName("PUT /api/attributes/values/{valueId} updates the label")
    void update_attribute_value_changes_label() {
        var attr = createAttribute("color", "ENUM");
        String attrId = attr.getString("id");

        var value = given()
                .spec(rest())
                .body(Map.of("value", "RED", "attributeId", attrId))
                .when()
                .post("/api/attributes/{id}/values", attrId)
                .then()
                .statusCode(201)
                .extract().jsonPath();

        String valueId = value.getString("id");
        long version = value.getLong("version");

        given()
                .spec(rest())
                .body(Map.of("id", valueId, "version", version, "value", "CRIMSON",
                        "attributeId", attrId, "audit", value.getMap("audit")))
                .when()
                .put("/api/attributes/values/{valueId}", valueId)
                .then()
                .statusCode(200)
                .body("value", equalTo("CRIMSON"))
                .body("version", greaterThanOrEqualTo((int) (version + 1)));

        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}/values", attrId)
                .then()
                .statusCode(200)
                .body("value", contains("CRIMSON"));
    }

    @Test
    @DisplayName("DELETE /api/attributes/values/{valueId} soft-deletes the value")
    void delete_attribute_value_returns_no_content() {
        var attr = createAttribute("priority", "ENUM");
        String attrId = attr.getString("id");

        var value = given()
                .spec(rest())
                .body(Map.of("value", "LOW", "attributeId", attrId))
                .when()
                .post("/api/attributes/{id}/values", attrId)
                .then()
                .statusCode(201)
                .extract().jsonPath();

        String valueId = value.getString("id");
        long version = value.getLong("version");

        given()
                .spec(rest())
                .when()
                .delete("/api/attributes/values/{vid}?version={v}", valueId, version)
                .then()
                .statusCode(204);

        given()
                .spec(rest())
                .when()
                .get("/api/attributes/{id}/values", attrId)
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    private JsonPath createAttribute(String name, String type) {
        return given()
                .spec(rest())
                .body(Map.of(
                        "name", name,
                        "attributeType", type,
                        "attributeValueTypeIdList", List.of()))
                .when()
                .post("/api/attributes")
                .then()
                .statusCode(201)
                .extract().jsonPath();
    }
}
