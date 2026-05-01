package com.osint.intelligence.server.e2e;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

/**
 * E2E coverage for the Solr-backed endpoints under {@code /api/intelligence}:
 * {@code /search}, {@code /search/facets}, and {@code /combined-search}.
 *
 * <p>Each test seeds rows via the public REST API, then drains the transactional outbox so the rows
 * are propagated to the {@code intelligence} Solr core before the search is exercised.
 */
class SearchE2EIT extends E2EBaseIT {

    private static final String SQUARE_AROUND_ISTANBUL =
            "POLYGON((28 40, 30 40, 30 42, 28 42, 28 40))";

    @Test
    @DisplayName("GET /api/intelligence/search?q=header:... returns matching rows")
    void search_by_header_returns_matching_rows() {
        String templateId = createTemplate("person");
        // Avoid hyphens in raw query terms — Solr's standard parser treats {@code -} as a NOT
        // operator unless the value is wrapped in quotes, which would mask real bugs.
        postIntel(templateId, "alphaTarget", null, List.of(), null);
        postIntel(templateId, "beta",        null, List.of(), null);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("q", "header:alphaTarget")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("header[0]", equalTo("alphaTarget"));
    }

    @Test
    @DisplayName("GET /api/intelligence/search by description returns matching rows")
    void search_by_description_returns_matching_rows() {
        String templateId = createTemplate("person");
        postIntel(templateId, "row-a", "matchableDescription", List.of(), null);
        postIntel(templateId, "row-b", "otherDescription",     List.of(), null);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("q", "description:matchableDescription")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("header[0]", equalTo("row-a"));
    }

    @Test
    @DisplayName("GET /api/intelligence/search filters by templateId when provided")
    void search_respects_template_filter() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");
        postIntel(personTpl,  "shared", null, List.of(), null);
        postIntel(vehicleTpl, "shared", null, List.of(), null);
        drainOutbox();

        // Both rows have header=shared, but the filter scopes to the person template.
        given()
                .spec(rest())
                .queryParam("q", "header:shared")
                .queryParam("templateId", personTpl)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("templateId[0]", equalTo(personTpl));
    }

    @Test
    @DisplayName("GET /api/intelligence/search returns empty list when nothing matches")
    void search_returns_empty_list_when_nothing_matches() {
        String templateId = createTemplate("person");
        postIntel(templateId, "alpha", null, List.of(), null);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("q", "header:nonexistent")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));
    }

    @Test
    @DisplayName("GET /api/intelligence/search/facets returns counts per templateId")
    void facets_by_templateId() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");
        postIntel(personTpl,  "p1", null, List.of(), null);
        postIntel(personTpl,  "p2", null, List.of(), null);
        postIntel(vehicleTpl, "v1", null, List.of(), null);
        drainOutbox();

        // Extract the body and compare via a typed Map; the templateId UUID keys contain hyphens
        // which trip GPath's `.body("templateId.\"<uuid>\"", ...)` lookup.
        var response = given()
                .spec(rest())
                .queryParam("fields", "templateId")
                .when()
                .get("/api/intelligence/search/facets")
                .then()
                .statusCode(200)
                .extract().jsonPath();
        Map<String, Object> counts = response.getMap("templateId");
        org.junit.jupiter.api.Assertions.assertNotNull(counts, "templateId facet bucket missing");
        org.junit.jupiter.api.Assertions.assertEquals(2, counts.get(personTpl),
                "person template count should be 2 in " + counts);
        org.junit.jupiter.api.Assertions.assertEquals(1, counts.get(vehicleTpl),
                "vehicle template count should be 1 in " + counts);
    }

    @Test
    @DisplayName("GET /api/intelligence/search/facets honors templateId filter")
    void facets_filtered_by_templateId() {
        String personTpl = createTemplate("person");
        String vehicleTpl = createTemplate("vehicle");
        postIntel(personTpl,  "p1", null, List.of("red", "blue"), null);
        postIntel(personTpl,  "p2", null, List.of("red"),         null);
        postIntel(vehicleTpl, "v1", null, List.of("green"),       null);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("templateId", personTpl)
                .queryParam("fields", "keywords")
                .when()
                .get("/api/intelligence/search/facets")
                .then()
                .statusCode(200)
                .body("keywords.red", equalTo(2))
                .body("keywords.blue", equalTo(1))
                .body("keywords.green", nullValue());
    }

    @Test
    @DisplayName("POST /api/intelligence/combined-search with text only returns Solr hits")
    void combined_search_text_only() {
        String templateId = createTemplate("person");
        postIntel(templateId, "match",    null, List.of(), null);
        postIntel(templateId, "no-match", null, List.of(), null);
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of("templateId", templateId, "query", "header:match"))
                .when()
                .post("/api/intelligence/combined-search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("match"))
                .body("capped", equalTo(false));
    }

    @Test
    @DisplayName("POST /api/intelligence/combined-search with polygon only returns geo hits")
    void combined_search_polygon_only() {
        String templateId = createTemplate("person");
        postIntel(templateId, "istanbul", null, List.of(), "POINT(29.0 41.0)");
        postIntel(templateId, "rome",     null, List.of(), "POINT(12.5 41.9)");
        drainOutbox();

        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("polygonWkt", SQUARE_AROUND_ISTANBUL);

        given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence/combined-search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("istanbul"))
                .body("capped", equalTo(false));
    }

    @Test
    @DisplayName("POST /api/intelligence/combined-search intersects text and polygon")
    void combined_search_text_and_polygon_intersection() {
        String templateId = createTemplate("person");
        // Text matches and inside polygon — should be in result.
        postIntel(templateId, "needle-istanbul",   null, List.of(), "POINT(29.0 41.0)");
        // Text matches but outside polygon — filtered out.
        postIntel(templateId, "needle-rome",       null, List.of(), "POINT(12.5 41.9)");
        // Inside polygon but text mismatch — filtered out.
        postIntel(templateId, "haystack-istanbul", null, List.of(), "POINT(29.05 41.05)");
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "templateId", templateId,
                        "query", "header:needle*",
                        "polygonWkt", SQUARE_AROUND_ISTANBUL))
                .when()
                .post("/api/intelligence/combined-search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("needle-istanbul"));
    }

    @Test
    @DisplayName("POST /api/intelligence/combined-search with no inputs returns empty records")
    void combined_search_no_inputs_returns_empty() {
        String templateId = createTemplate("person");
        postIntel(templateId, "some", null, List.of(), "POINT(29 41)");
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of("templateId", templateId))
                .when()
                .post("/api/intelligence/combined-search")
                .then()
                .statusCode(200)
                .body("records", hasSize(0))
                .body("capped", equalTo(false));
    }

    @Test
    @DisplayName("GET /api/intelligence/search picks up updates after a write")
    void search_reflects_updates_after_outbox_drain() {
        String templateId = createTemplate("person");
        var created = postIntel(templateId, "v1-header", null, List.of(), null);
        drainOutbox();

        Map<String, Object> updateBody = new HashMap<>();
        updateBody.put("templateId", templateId);
        updateBody.put("header", "v2-header");
        updateBody.put("keywords", List.of());
        updateBody.put("attachedFileUniqueIdList", List.of());
        updateBody.put("relatedLocationWktList", List.of());
        updateBody.put("relatedIntelligenceIdList", List.of());
        updateBody.put("attributeIdToAttributeValueMap", Map.of());
        updateBody.put("id", created.getString("id"));
        updateBody.put("version", created.getLong("version"));

        given()
                .spec(rest())
                .body(updateBody)
                .when()
                .put("/api/intelligence/{id}", created.getString("id"))
                .then()
                .statusCode(200);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("q", "header:v1-header")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));

        given()
                .spec(rest())
                .queryParam("q", "header:v2-header")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(1));
    }

    @Test
    @DisplayName("GET /api/intelligence/search drops soft-deleted rows")
    void search_excludes_deleted_rows() {
        String templateId = createTemplate("person");
        var keep = postIntel(templateId, "keep-me", null, List.of(), null);
        var drop = postIntel(templateId, "drop-me", null, List.of(), null);
        drainOutbox();

        given()
                .spec(rest())
                .when()
                .delete("/api/intelligence/{id}?version={v}",
                        drop.getString("id"), drop.getLong("version"))
                .then()
                .statusCode(204);
        drainOutbox();

        given()
                .spec(rest())
                .queryParam("q", "header:drop-me")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(0));

        given()
                .spec(rest())
                .queryParam("q", "header:keep-me")
                .queryParam("templateId", templateId)
                .when()
                .get("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("id[0]", equalTo(keep.getString("id")));
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

    private JsonPath postIntel(String templateId, String header, String description,
                               List<String> keywords, String wkt) {
        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("header", header);
        body.put("description", description);
        body.put("keywords", keywords == null ? List.of() : keywords);
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
