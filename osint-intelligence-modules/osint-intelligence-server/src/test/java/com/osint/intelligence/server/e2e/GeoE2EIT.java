package com.osint.intelligence.server.e2e;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;

/**
 * E2E coverage for the geospatial endpoints under {@code /api/intelligence}.
 *
 * <p>Real PostGIS performs the {@code ST_Contains} / {@code ST_DWithin} queries inside the
 * {@code postgis/postgis:16-3.4} container, so coordinates are evaluated against the real spatial
 * predicates rather than mocked.
 */
class GeoE2EIT extends E2EBaseIT {

    /** A 1-degree square polygon centered slightly to the south-west of (lon=29, lat=41). */
    private static final String SQUARE_AROUND_ISTANBUL =
            "POLYGON((28 40, 30 40, 30 42, 28 42, 28 40))";

    @Test
    @DisplayName("POST /api/intelligence/within-polygon -> only rows whose primary point is inside")
    void within_polygon_returns_matching_rows() {
        String templateId = createTemplate("person");

        // Inside the polygon
        postIntel(templateId, "istanbul-A", "POINT(29.0 41.0)");
        postIntel(templateId, "istanbul-B", "POINT(28.5 40.5)");
        // Outside the polygon
        postIntel(templateId, "rome",       "POINT(12.5 41.9)");
        postIntel(templateId, "ankara-far", "POINT(33.0 39.0)");
        // No location at all
        postIntel(templateId, "no-loc",     null);

        given()
                .spec(rest())
                .body(Map.of("templateId", templateId, "polygonWkt", SQUARE_AROUND_ISTANBUL))
                .when()
                .post("/api/intelligence/within-polygon")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("header", containsInAnyOrder("istanbul-A", "istanbul-B"));
    }

    @Test
    @DisplayName("POST /api/intelligence/within-polygon respects templateId filter")
    void within_polygon_filters_by_template() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");

        postIntel(personTpl, "person-istanbul", "POINT(29.0 41.0)");
        postIntel(vehicleTpl, "car-istanbul",   "POINT(29.1 41.1)");

        given()
                .spec(rest())
                .body(Map.of("templateId", personTpl, "polygonWkt", SQUARE_AROUND_ISTANBUL))
                .when()
                .post("/api/intelligence/within-polygon")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("header", containsInAnyOrder("person-istanbul"));
    }

    @Test
    @DisplayName("POST /api/intelligence/within-polygon without templateId returns rows from all templates")
    void within_polygon_without_template_returns_all() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");

        postIntel(personTpl, "person-istanbul", "POINT(29.0 41.0)");
        postIntel(vehicleTpl, "car-istanbul",   "POINT(29.1 41.1)");

        Map<String, Object> body = new HashMap<>();
        body.put("polygonWkt", SQUARE_AROUND_ISTANBUL);
        // templateId intentionally omitted

        given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence/within-polygon")
                .then()
                .statusCode(200)
                .body("$", hasSize(2));
    }

    @Test
    @DisplayName("POST /api/intelligence/within-polygon ignores soft-deleted rows")
    void within_polygon_excludes_soft_deleted() {
        String templateId = createTemplate("person");
        var keep = postIntel(templateId, "istanbul-keep",   "POINT(29.0 41.0)");
        var drop = postIntel(templateId, "istanbul-delete", "POINT(29.05 41.05)");

        given()
                .spec(rest())
                .when()
                .delete("/api/intelligence/{id}?version={v}",
                        drop.getString("id"), drop.getLong("version"))
                .then()
                .statusCode(204);

        given()
                .spec(rest())
                .body(Map.of("templateId", templateId, "polygonWkt", SQUARE_AROUND_ISTANBUL))
                .when()
                .post("/api/intelligence/within-polygon")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("header[0]", org.hamcrest.Matchers.equalTo("istanbul-keep"));
        // Reference 'keep' so static analyzers don't flag it as unused.
        org.junit.jupiter.api.Assertions.assertNotNull(keep.getString("id"));
    }

    @Test
    @DisplayName("POST /api/intelligence/within-polygon with blank polygonWkt -> 400")
    void within_polygon_requires_polygon_wkt() {
        given()
                .spec(rest())
                .body(Map.of("polygonWkt", ""))
                .when()
                .post("/api/intelligence/within-polygon")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("GET /api/intelligence/near -> only rows within the radius")
    void near_returns_rows_within_radius() {
        String templateId = createTemplate("person");
        // Center used in /near: (lat=41.0, lon=29.0)
        postIntel(templateId, "very-close",  "POINT(29.001 41.001)");   // ~150 m
        postIntel(templateId, "close",       "POINT(29.05 41.05)");     // ~6 km
        postIntel(templateId, "far",         "POINT(33.0 39.0)");       // hundreds of km

        given()
                .spec(rest())
                .queryParam("templateId", templateId)
                .queryParam("lat", 41.0)
                .queryParam("lon", 29.0)
                .queryParam("km", 10)
                .when()
                .get("/api/intelligence/near")
                .then()
                .statusCode(200)
                .body("$", hasSize(2))
                .body("header", containsInAnyOrder("very-close", "close"));
    }

    @Test
    @DisplayName("GET /api/intelligence/near with tiny radius isolates the closest point")
    void near_tight_radius_returns_single() {
        String templateId = createTemplate("person");
        postIntel(templateId, "very-close", "POINT(29.001 41.001)");
        postIntel(templateId, "close",      "POINT(29.05 41.05)");

        given()
                .spec(rest())
                .queryParam("templateId", templateId)
                .queryParam("lat", 41.0)
                .queryParam("lon", 29.0)
                .queryParam("km", 1)
                .when()
                .get("/api/intelligence/near")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("header[0]", org.hamcrest.Matchers.equalTo("very-close"));
    }

    @Test
    @DisplayName("GET /api/intelligence/near without templateId queries across templates")
    void near_without_template_returns_all_templates() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");
        postIntel(personTpl, "person-near", "POINT(29.001 41.001)");
        postIntel(vehicleTpl, "car-near",   "POINT(29.002 41.002)");

        given()
                .spec(rest())
                .queryParam("lat", 41.0)
                .queryParam("lon", 29.0)
                .queryParam("km", 5)
                .when()
                .get("/api/intelligence/near")
                .then()
                .statusCode(200)
                .body("$", hasSize(2));
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
        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("header", header);
        body.put("keywords", List.of());
        body.put("attachedFileUniqueIdList", List.of());
        body.put("locationWkt", wkt);
        body.put("relatedLocationWktList", List.of());
        body.put("relatedIntelligenceIdList", List.of());
        body.put("attributeIdToAttributeValueMap", Map.of());

        return given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(202)
                .extract().jsonPath();
    }
}
