package com.isr.intelligence.server.e2e;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

/**
 * E2E coverage for the single generic search endpoint. The endpoint chooses Solr, PostGIS,
 * or a combined execution plan from the SearchQuery payload.
 */
class SearchE2EIT extends E2EBaseIT {

    private static final String SQUARE_AROUND_ISTANBUL =
            "POLYGON((28 40, 30 40, 30 42, 28 42, 28 40))";

    @Test
    @DisplayName("POST /api/intelligence/search uses q as fieldless full text")
    void search_free_text_uses_managed_schema_text_copy() {
        String templateId = createTemplate("person", List.of());
        postIntel(templateId, "alpha terror report", "plain row", List.of(), null, Map.of());
        postIntel(templateId, "ordinary report", "plain row", List.of(), null, Map.of());
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of("q", "terror", "page", 0, "row", 10))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("alpha terror report"))
                .body("facets", equalTo(Map.of()));
    }

    @Test
    @DisplayName("POST /api/intelligence/search resolves dynamic enum by attribute name")
    void search_dynamic_enum_filter_uses_attribute_name_and_stable_value_id_storage() {
        String colorId = createAttribute("color", "ENUM");
        String redId = createAttributeValue(colorId, "KIRMIZI");
        String blueId = createAttributeValue(colorId, "MAVI");
        String templateId = createTemplate("vehicle", List.of(colorId));

        postIntel(templateId, "red car", null, List.of(), null, Map.of(colorId, redId));
        postIntel(templateId, "blue car", null, List.of(), null, Map.of(colorId, blueId));
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "page", 0,
                        "row", 10,
                        "queryHolders", List.of(
                                holder("templateId", "EQ", templateId),
                                holder("color", "EQ", "KIRMIZI"))))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("red car"))
                .body("records[0].attributeIdToAttributeValueMap." + colorId, equalTo(redId));
    }

    @Test
    @DisplayName("POST /api/intelligence/search returns facets from the generic query")
    void search_facets_use_logical_attribute_names_and_return_stable_value_ids() {
        String colorId = createAttribute("color", "ENUM");
        String redId = createAttributeValue(colorId, "KIRMIZI");
        String blueId = createAttributeValue(colorId, "MAVI");
        String templateId = createTemplate("vehicle", List.of(colorId));

        postIntel(templateId, "red car", null, List.of(), null, Map.of(colorId, redId));
        postIntel(templateId, "blue car", null, List.of(), null, Map.of(colorId, blueId));
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "page", 0,
                        "row", 10,
                        "facetFields", List.of("color"),
                        "queryHolders", List.of(holder("templateId", "EQ", templateId))))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(2))
                .body("facets.color." + redId, equalTo(1))
                .body("facets.color." + blueId, equalTo(1));
    }

    @Test
    @DisplayName("POST /api/intelligence/search combines fieldless q and within polygon")
    void search_combines_free_text_and_polygon_by_id_intersection() {
        String templateId = createTemplate("person", List.of());
        postIntel(templateId, "needle istanbul", null, List.of(), "POINT(29 41)", Map.of());
        postIntel(templateId, "needle ankara", null, List.of(), "POINT(32.85 39.93)", Map.of());
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "q", "needle",
                        "page", 0,
                        "row", 10,
                        "queryHolders", List.of(
                                holder("templateId", "EQ", templateId),
                                holder("location", "WITHIN_POLYGON", SQUARE_AROUND_ISTANBUL))))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("needle istanbul"));
    }

    @Test
    @DisplayName("POST /api/intelligence/search routes near queries to PostGIS")
    void search_near_uses_postgis_when_query_is_geo_only() {
        String templateId = createTemplate("person", List.of());
        postIntel(templateId, "near", null, List.of(), "POINT(29 41)", Map.of());
        postIntel(templateId, "far", null, List.of(), "POINT(32.85 39.93)", Map.of());
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "page", 0,
                        "row", 10,
                        "queryHolders", List.of(
                                holder("templateId", "EQ", templateId),
                                holder("location", "NEAR", Map.of("lat", 41.0, "lon", 29.0, "km", 20)))))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(1))
                .body("records[0].header", equalTo("near"));
    }

    @Test
    @DisplayName("POST /api/intelligence/search treats lastQueryTime as a normal searchable field")
    void search_last_query_time_filters_last_modified() {
        String templateId = createTemplate("person", List.of());
        postIntel(templateId, "old enough", null, List.of(), null, Map.of());
        drainOutbox();

        given()
                .spec(rest())
                .body(Map.of(
                        "page", 0,
                        "row", 10,
                        "queryHolders", List.of(
                                holder("templateId", "EQ", templateId),
                                holder("lastQueryTime", "GT", "2999-01-01T00:00:00Z"))))
                .when()
                .post("/api/intelligence/search")
                .then()
                .statusCode(200)
                .body("records", hasSize(0));
    }

    private String createAttribute(String name, String type) {
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
                .extract().path("id");
    }

    private String createAttributeValue(String attributeId, String value) {
        return given()
                .spec(rest())
                .body(Map.of("value", value, "attributeId", attributeId))
                .when()
                .post("/api/attributes/{attributeId}/values", attributeId)
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private String createTemplate(String name, List<String> attributeIds) {
        return given()
                .spec(rest())
                .body(Map.of(
                        "name", name + "-" + UUID.randomUUID(),
                        "childTemplateIdList", List.of(),
                        "attributeIdList", attributeIds))
                .when()
                .post("/api/templates")
                .then()
                .statusCode(201)
                .extract().path("id");
    }

    private JsonPath postIntel(String templateId, String header, String description,
                               List<String> keywords, String wkt, Map<String, Object> attributes) {
        Map<String, Object> body = new HashMap<>();
        body.put("templateId", templateId);
        body.put("header", header);
        body.put("description", description);
        body.put("keywords", keywords == null ? List.of() : keywords);
        body.put("attachedFileUniqueIdList", List.of());
        body.put("locationWkt", wkt);
        body.put("relatedLocationWktList", List.of());
        body.put("relatedIntelligenceIdList", List.of());
        body.put("attributeIdToAttributeValueMap", attributes == null ? Map.of() : attributes);

        return given()
                .spec(rest())
                .body(body)
                .when()
                .post("/api/intelligence")
                .then()
                .statusCode(202)
                .extract().jsonPath();
    }

    private Map<String, Object> holder(String field, String operator, Object value) {
        return Map.of(
                "queryFieldName", field,
                "queryOperator", operator,
                "queryFieldValue", value);
    }
}
