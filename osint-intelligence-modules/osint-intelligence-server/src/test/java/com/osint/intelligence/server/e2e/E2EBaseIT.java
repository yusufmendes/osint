package com.osint.intelligence.server.e2e;

import com.osint.intelligence.server.outbox.OutboxWorker;
import com.osint.intelligence.server.repository.OutboxRepository;
import com.osint.intelligence.server.service.AttributeCacheService;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import org.apache.solr.client.solrj.SolrClient;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.lifecycle.Startables;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

/**
 * Base class for E2E integration tests.
 *
 * <p>Lifecycle:
 * <ul>
 *   <li>JVM-shared {@link PostgreSQLContainer} ({@code postgis/postgis:16-3.4}) — Flyway runs at app
 *       startup against this DB.</li>
 *   <li>JVM-shared Solr 9 container loaded with the {@code intelligence} core configset copied from
 *       the sibling {@code osint-intelligence-solr-server} module.</li>
 *   <li>The Spring Boot application is booted in the test JVM on a random local port via
 *       {@link SpringBootTest}; tests issue real HTTP/REST requests against it.</li>
 *   <li>Containers and the application context are stopped automatically when the JVM exits
 *       (Testcontainers Ryuk + Spring TestContext lifecycle).</li>
 * </ul>
 *
 * <p>Each test gets a clean slate via {@link #cleanState()} which truncates DB tables,
 * deletes every Solr document, and invalidates the in-process attribute cache.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class E2EBaseIT {

    /** Postgres + PostGIS source of truth — same image used in production. */
    static final PostgreSQLContainer<?> PG;

    /** Solr 9 with the {@code intelligence} core preloaded. */
    static final GenericContainer<?> SOLR;

    static {
        PG = new PostgreSQLContainer<>(
                DockerImageName.parse("postgis/postgis:16-3.4")
                        .asCompatibleSubstituteFor("postgres"))
                .withDatabaseName("intelligence")
                .withUsername("intelligence")
                .withPassword("intelligence");

        SOLR = new GenericContainer<>(DockerImageName.parse("solr:9.10.1"))
                .withExposedPorts(8983)
                .withCopyFileToContainer(
                        MountableFile.forHostPath(resolveSolrConfDir()),
                        "/opt/solr/server/solr/configsets/intelligence/conf")
                .withCommand("solr-precreate", "intelligence",
                        "/opt/solr/server/solr/configsets/intelligence")
                .waitingFor(Wait.forHttp("/solr/intelligence/select?q=*:*&wt=json")
                        .forStatusCode(200)
                        .withStartupTimeout(Duration.ofMinutes(3)));

        Startables.deepStart(PG, SOLR).join();
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", PG::getJdbcUrl);
        registry.add("spring.datasource.username", PG::getUsername);
        registry.add("spring.datasource.password", PG::getPassword);
        registry.add("intelligence.solr.base-url", () ->
                "http://" + SOLR.getHost() + ":" + SOLR.getMappedPort(8983) + "/solr");
        registry.add("intelligence.solr.collection", () -> "intelligence");
        // Keep poll interval short; tests still sync deterministically via outboxWorker.processBatch().
        registry.add("intelligence.outbox.poll-millis", () -> "200");
    }

    @LocalServerPort
    int serverPort;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SolrClient solrClient;

    @Autowired
    OutboxWorker outboxWorker;

    @Autowired
    OutboxRepository outboxRepository;

    @Autowired
    AttributeCacheService attributeCache;

    @BeforeEach
    void cleanState() throws Exception {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = serverPort;

        // Truncate every domain table; CASCADE clears the FK from intelligence -> template.
        jdbc.execute("TRUNCATE TABLE intelligence_outbox, intelligence, template, "
                + "attribute, attribute_type_value RESTART IDENTITY CASCADE");

        // Wipe Solr (the production SolrClient is URL-bound to the intelligence collection).
        solrClient.deleteByQuery("*:*");
        solrClient.commit();

        // Drop cached attribute/value translations so re-seeded ids don't collide with stale state.
        attributeCache.invalidateAttributes();
        attributeCache.invalidateValues();
    }

    /** Returns a pre-configured RestAssured spec with JSON content type and the local server URL. */
    protected RequestSpecification rest() {
        return new RequestSpecBuilder()
                .setBaseUri("http://localhost")
                .setPort(serverPort)
                .setContentType(ContentType.JSON)
                .setAccept(ContentType.JSON)
                .build();
    }

    /**
     * Runs the outbox -> Solr sync deterministically (the @Scheduled poller also runs in the
     * background; this just makes tests resilient to timing).
     */
    protected void drainOutbox() {
        // Multiple passes flush any cascading entries surfaced during processing.
        for (int i = 0; i < 5 && outboxRepository.pendingCount() > 0; i++) {
            outboxWorker.processBatch();
        }
    }

    /**
     * Resolves the Solr configset directory ({@code conf/}) from either the failsafe-supplied system
     * property or the project layout. The resources plugin stages a copy at
     * {@code target/test-solr-conf} during {@code process-test-resources}.
     */
    private static Path resolveSolrConfDir() {
        String fromProp = System.getProperty("solr.conf.dir");
        if (fromProp != null && !fromProp.isBlank()) {
            Path p = Paths.get(fromProp);
            if (Files.isDirectory(p)) {
                return p;
            }
        }
        Path staged = Paths.get("target", "test-solr-conf");
        if (Files.isDirectory(staged)) {
            return staged;
        }
        // Last-resort: read directly from the sibling source module (works when running from IDE).
        Path sibling = Paths.get("..", "osint-intelligence-solr-server", "src", "main", "resources", "conf");
        if (Files.isDirectory(sibling)) {
            return sibling;
        }
        throw new IllegalStateException(
                "Could not locate Solr configset. Tried -Dsolr.conf.dir, target/test-solr-conf, "
                        + "and ../osint-intelligence-solr-server/src/main/resources/conf. "
                        + "Run mvn process-test-resources first or pass -Dsolr.conf.dir=...");
    }
}
