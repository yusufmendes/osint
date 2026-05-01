# osint-intelligence-server

Spring Boot + jOOQ MVP for the intelligence platform. PostgreSQL/PostGIS is the source of truth; Solr is kept eventually consistent through a transactional outbox.

This module implements the architecture documented in [`Initial Implementation.md`](../Initial%20Implementation.md).

## Stack

| Component | Version |
|-----------|---------|
| Java | 21 |
| Maven | 3.9.x |
| Spring Boot | 3.4.5 |
| jOOQ | bundled by `spring-boot-starter-jooq` |
| Solr (client) | 9.10.x |
| PostgreSQL | 16 (Docker `postgis/postgis:16-3.4`) |
| Flyway | bundled by Spring Boot |

## Local environment

From the repository root, activate the bundled toolchain:

```powershell
. .\osint-tools\env.ps1
```

This sets `JAVA_HOME`, `MAVEN_HOME` etc. without touching system installs.

## Run a Postgres/PostGIS container

```powershell
docker run --rm -d --name intelligence-pg `
  -e POSTGRES_DB=intelligence `
  -e POSTGRES_USER=intelligence `
  -e POSTGRES_PASSWORD=intelligence `
  -p 5432:5432 `
  postgis/postgis:16-3.4
```

Solr is provided by [`osint-intelligence-solr-server`](../osint-intelligence-solr-server). Start it separately according to that module's instructions.

## Build / run

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-model\pom.xml -DskipTests install
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml -DskipTests package
java -jar .\osint-intelligence-modules\osint-intelligence-server\target\osint-intelligence-server.jar
```

The server listens on `http://localhost:8081` by default. Override via env vars: `INTEL_SERVER_PORT`, `INTEL_DB_URL`, `INTEL_DB_USER`, `INTEL_DB_PASSWORD`, `INTEL_SOLR_BASE_URL`, `INTEL_SOLR_COLLECTION`.

## Endpoints (MVP)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/intelligence?templateId=X&lastQueryTime=Y` | delta sync |
| `GET` | `/api/intelligence/{id}` | by id |
| `POST` | `/api/intelligence` | create |
| `PUT` | `/api/intelligence/{id}` | update |
| `DELETE` | `/api/intelligence/{id}?version=N` | soft delete |
| `POST` | `/api/intelligence/within-polygon` | `{ templateId?, polygonWkt }` |
| `GET` | `/api/intelligence/near?lat=&lon=&km=&templateId=` | distance |
| `GET` | `/api/intelligence/search?q=...&templateId=` | Solr full-text |
| `GET` | `/api/intelligence/search/facets?templateId=&fields=...` | Solr facets |
| `POST` | `/api/intelligence/combined-search` | text + polygon (parallel + intersect) |
| `GET` `POST` `PUT` `DELETE` | `/api/templates`, `/api/attributes`, `/api/attributes/{id}/values` | reference data CRUD |
| `GET` | `/actuator/health` | health |

All write endpoints accept an optional `X-User` header used for the `created_by` / `modified_by` audit columns (default `system`).

Geometries are sent and received as **WKT** (SRID 4326).

## jOOQ codegen (optional)

The default build does **not** run codegen (so the build does not need a live Postgres). Once you have the database with Flyway-applied migrations, generate the typed classes with:

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml -Pjooq-codegen generate-sources -DskipTests
```

Generated types land under `target/generated-sources/jooq` in package `com.osint.intelligence.db.generated`. The hand-written constants in [`Tables.java`](src/main/java/com/osint/intelligence/server/db/Tables.java) intentionally use the same names so repositories can be migrated incrementally.

## Tests

Tests use Testcontainers (`postgis/postgis:16-3.4`) and require Docker. SolrJ is mocked at the bean level.

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml test
```

## Layout

```
osint-intelligence-server/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/osint/intelligence/server/
    │   │   ├── IntelligenceServerApplication.java
    │   │   ├── api/                 — REST controllers + request/response DTOs
    │   │   ├── config/              — Spring config (Solr, CORS, properties)
    │   │   ├── db/                  — jOOQ table refs, PostGIS helper, JTS binding
    │   │   ├── dto/                 — internal DTOs and outbox enums
    │   │   ├── error/               — exceptions mapped to HTTP statuses
    │   │   ├── outbox/              — OutboxWorker (@Scheduled)
    │   │   ├── repository/          — jOOQ repositories
    │   │   └── service/             — orchestration (IntelligenceService, CombinedSearchService, …)
    │   └── resources/
    │       ├── application.yml
    │       ├── logback-spring.xml
    │       └── db/migration/        — V1, V2, V3 Flyway migrations
    └── test/
        └── java/com/osint/intelligence/server/  — Testcontainers integration tests
```
