package com.osint.intelligence.server;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for tests that need a real Postgres + PostGIS (via {@code postgis/postgis:16-3.4}).
 * Solr remains mocked at the bean level.
 */
@Testcontainers
public abstract class AbstractPostgisIT {

    @Container
    @SuppressWarnings("resource")
    protected static final PostgreSQLContainer<?> PG = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:16-3.4")
                    .asCompatibleSubstituteFor("postgres"))
            .withDatabaseName("intelligence")
            .withUsername("intelligence")
            .withPassword("intelligence");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
        // Disable the scheduler in tests; we drive the worker manually.
        registry.add("intelligence.outbox.poll-millis", () -> "60000000");
        registry.add("intelligence.solr.base-url", () -> "http://localhost:0/solr");
        registry.add("intelligence.solr.collection", () -> "test");
    }
}
