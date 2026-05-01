package com.osint.intelligence.server.e2e;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

/**
 * E2E coverage for the actuator endpoints exposed by the application.
 */
class HealthE2EIT extends E2EBaseIT {

    @Test
    @DisplayName("GET /actuator/health -> 200 and UP")
    void health_endpoint_reports_up() {
        given()
                .spec(rest())
                .when()
                .get("/actuator/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("UP"))
                // health-detail visibility is `always`, so DB and Solr are listed.
                .body("components", notNullValue());
    }

    @Test
    @DisplayName("GET /actuator/info -> 200")
    void info_endpoint_returns_ok() {
        given()
                .spec(rest())
                .when()
                .get("/actuator/info")
                .then()
                .statusCode(200);
    }

    @Test
    @DisplayName("GET /actuator/metrics -> 200")
    void metrics_endpoint_returns_ok() {
        given()
                .spec(rest())
                .when()
                .get("/actuator/metrics")
                .then()
                .statusCode(200)
                .body("names", notNullValue());
    }
}
