# osint-intelligence-server

Spring Boot service that exposes the OSINT intelligence platform as a REST API. PostgreSQL/PostGIS is the system of record; Apache Solr is kept eventually consistent through a transactional outbox.

For design rationale, ADR-style decisions, and deeper internals, see [`DesignAndImplementationDetail.md`](./DesignAndImplementationDetail.md). This README is the **operational** guide: how to bring everything up from zero, how the database schema gets created automatically, how a write flows from REST to Postgres to Solr, and how tests verify all of it.

---

## Table of contents

1. [What this module does (in one diagram)](#what-this-module-does-in-one-diagram)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick start — bring everything up from zero](#quick-start--bring-everything-up-from-zero)
5. [Database bootstrap pipeline (Flyway 101)](#database-bootstrap-pipeline-flyway-101)
6. [Domain model → SQL schema mapping](#domain-model--sql-schema-mapping)
7. [Write pipeline: REST → Postgres → Outbox → Solr](#write-pipeline-rest--postgres--outbox--solr)
8. [Configuration reference](#configuration-reference)
9. [Endpoints](#endpoints)
10. [Tests](#tests)
11. [Layout](#layout)

---

## What this module does (in one diagram)

```
┌───────────┐  HTTP/JSON  ┌───────────────────────────┐
│  Client   │ ──────────▶ │  osint-intelligence-server │
└───────────┘             │   (Spring Boot, port 8081)│
                          └─────────────┬─────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │ writes (jOOQ)           │ reads (jOOQ + PostGIS)  │
              ▼                         ▼                         ▼
   ┌─────────────────────┐   ┌────────────────────┐   ┌───────────────────────┐
   │ intelligence_outbox │   │ intelligence       │   │ template / attribute  │
   │ (sync queue)        │   │ + JSONB attrs      │   │ / attribute_type_value│
   └──────────┬──────────┘   │ + GEOMETRY(4326)   │   └───────────────────────┘
              │              └────────────────────┘
              │ @Scheduled OutboxWorker
              ▼
   ┌──────────────────────┐
   │ Apache Solr core      │ ← full-text + facets + spatial RPT
   │ "intelligence"        │
   └──────────────────────┘
```

The contract:
- **Postgres is the source of truth.** Every endpoint that returns "the truth" reads from Postgres.
- **Solr is a derived, eventually-consistent search index.** It is rebuilt from the outbox and is only used for full-text and faceted queries.
- A row in Postgres and the matching outbox event commit in the **same transaction**. The Solr write happens later, asynchronously, by a scheduled worker.

---

## Tech stack

| Component | Version | Why |
|-----------|---------|-----|
| Java | 21 | LTS, records, pattern matching, virtual threads available |
| Maven | 3.9.x | Build & dependency management |
| Spring Boot | 3.4.5 | HTTP layer, transactions, configuration, scheduling |
| jOOQ | 3.19 (via `spring-boot-starter-jooq`) | Type-safe SQL DSL — we hand-write the table refs in [`Tables.java`](src/main/java/com/osint/intelligence/server/db/Tables.java) instead of running codegen at build time, so the build does not need a live database |
| Flyway | bundled by Spring Boot | Database migration tool — applies `V1__*.sql`, `V2__*.sql`, … in order at boot |
| PostgreSQL + PostGIS | 16 / 3.4 (`postgis/postgis:16-3.4`) | Source of truth + spatial indexes |
| Apache Solr | 9.10.x (client + server) | Full-text and faceted search |
| RestAssured + Testcontainers | bundled by tests | E2E integration tests against ephemeral Postgres + Solr |

---

## Prerequisites

You need three things on the host you're running this from:

1. **Java 21 + Maven 3.9+** — the repo ships a self-contained toolchain. From the repo root:

   ```powershell
   . .\osint-tools\env.ps1
   java -version   # 21.x
   mvn -version    # 3.9.x
   ```

   This sets `JAVA_HOME` / `MAVEN_HOME` for the current shell only — your global installs are untouched.

2. **Docker** (or a remote Docker daemon reachable over `DOCKER_HOST`). Used to run Postgres and Solr without polluting your machine.

3. **The shared model module installed locally**, so the server can resolve `osint-intelligence-model`:

   ```powershell
   mvn -f .\osint-intelligence-modules\osint-intelligence-model\pom.xml -DskipTests install
   ```

---

## Quick start — bring everything up from zero

This walks you from "nothing installed" to "REST API answering requests against a freshly initialised database".

### Step 1 — Start a Postgres + PostGIS container

```powershell
docker run --rm -d --name intelligence-pg `
  -e POSTGRES_DB=intelligence `
  -e POSTGRES_USER=intelligence `
  -e POSTGRES_PASSWORD=intelligence `
  -p 5432:5432 `
  postgis/postgis:16-3.4
```

What this gives you:

- A blank Postgres 16 server listening on `localhost:5432`.
- An empty database called `intelligence` with the `postgres` superuser **and** an `intelligence` user that owns the database.
- The PostGIS shared libraries are pre-installed in the image but **not yet enabled** in the database — that is done by the Flyway migration on first boot (see [Database bootstrap pipeline](#database-bootstrap-pipeline-flyway-101) below).

> No tables exist yet. The schema is empty. That is intentional.

### Step 2 — Start the Solr container with the `intelligence` core

Solr is provided by the sibling module [`osint-intelligence-solr-server`](../osint-intelligence-solr-server). Follow its README to either build a Docker image (`-Pdeployment`) or start Solr locally with the configset under `src/main/resources/conf`. The server expects a Solr collection named `intelligence` exposed at `http://localhost:8983/solr` by default.

### Step 3 — Build and run the server

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml -DskipTests package
java -jar .\osint-intelligence-modules\osint-intelligence-server\target\osint-intelligence-server.jar
```

On the very first start you will see logs that look roughly like this:

```
HikariPool-1 - Starting...
Database: jdbc:postgresql://localhost:5432/intelligence (PostgreSQL 16.x)
Schema history table "public"."flyway_schema_history" does not exist yet
Successfully validated 3 migrations
Creating Schema History table "public"."flyway_schema_history" ...
Current version of schema "public": << Empty Schema >>
Migrating schema "public" to version "1 - schema"
Migrating schema "public" to version "2 - indexes"
Migrating schema "public" to version "3 - outbox"
Successfully applied 3 migrations to schema "public"
Tomcat started on port 8081 (http)
```

That is the full database bootstrap. From here on, the API is live at `http://localhost:8081`. The next time the same JVM starts, Flyway will see "current version 3, no new migrations" and do nothing.

### Step 4 — Talk to it

```powershell
curl http://localhost:8081/actuator/health
curl http://localhost:8081/api/templates
```

---

## Database bootstrap pipeline (Flyway 101)

> If you have never used Flyway, read this section once and you'll know everything you need to operate this service.

### What is Flyway?

Flyway is a **database migration tool**. Its job is to keep the database schema in sync with the source code, automatically and reproducibly.

You write **migration files** — plain `.sql` scripts — and put them in a known folder. Each file is named with a version prefix:

```
V<version>__<description>.sql
```

For example: `V1__schema.sql`, `V2__indexes.sql`, `V3__outbox.sql`.

When the application starts, Flyway:

1. Connects to the database using the same datasource Spring Boot uses for the app.
2. Looks for a bookkeeping table named `flyway_schema_history`. If it doesn't exist, it creates it.
3. Reads the `V*.sql` files from the classpath path configured by `spring.flyway.locations` (we use `classpath:db/migration`).
4. Compares each script's version to the rows in `flyway_schema_history`.
5. Runs the missing scripts **in version order**, in transactions, recording each one in `flyway_schema_history` with a checksum.
6. If a script that has already run is later modified on disk, Flyway aborts with a checksum mismatch — so once a migration is shipped, it is immutable. New changes always go into a new `V<n+1>__*.sql`.

That is it. There is no extra tool to invoke, no separate "migrate" command. The application boot **is** the migration step.

### Where the scripts live

```
src/main/resources/db/migration/
├── V1__schema.sql      tables + Postgres extensions
├── V2__indexes.sql     spatial / BRIN / GIN / partial indexes
└── V3__outbox.sql      transactional outbox table + index
```

These are packaged into the JAR. No file system manipulation is required.

### V1 — `V1__schema.sql` (extensions + tables)

Run on first start against an empty database. It does two things:

#### a) Enables three Postgres extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

| Extension  | Why we need it |
|------------|----------------|
| `postgis`  | Adds the `GEOMETRY` data type, spatial indexes (`GIST`), and functions like `ST_Contains`, `ST_DWithin`, `ST_Intersects`. Without it, the `intelligence.location` column does not even compile. |
| `uuid-ossp` | Lets us generate UUIDs in SQL when needed (the application also generates them in Java). |
| `btree_gist` | Enables mixing scalar columns (e.g. `template_id TEXT`) with a `geometry` column inside a single composite GiST index — used by `idx_intelligence_template_location` in V2. Without it Postgres rejects the index with `data type text has no default operator class for access method gist`. |

#### b) Creates four domain tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `attribute_type_value` | Catalog of allowed values for ENUM-typed attributes (think dropdown options). | `id`, `value`, `attribute_id` |
| `attribute` | Schema definition of a single attribute (name + type + optional value-type ids). | `id`, `name`, `attribute_type`, `attribute_value_type_ids[]` |
| `template` | A "kind" of intelligence (e.g. *person*, *vehicle*) — references the attributes and child templates that belong to it. | `id`, `name`, `child_template_ids[]`, `attribute_ids[]` |
| `intelligence` | The actual records (the data being collected). FK to `template`. | `id`, `header`, `description`, `keywords[]`, `location GEOMETRY(Geometry,4326)`, `attribute_values JSONB`, … |

Every table also has the same audit + soft-delete tail:

```sql
created_at    TIMESTAMPTZ NOT NULL,
created_by    TEXT,
last_modified TIMESTAMPTZ NOT NULL,
modified_by   TEXT,
deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
deleted_at    TIMESTAMPTZ,
deleted_by    TEXT
```

Why these conventions:

- **`version BIGINT NOT NULL DEFAULT 0`** on every table — used for **optimistic locking**. Every UPDATE statement adds `WHERE id=? AND version=?` and increments the version. If the where clause matches zero rows we throw `OptimisticLockException` (HTTP 409). This catches concurrent edits without taking row locks.
- **Soft delete (`deleted` flag + `deleted_at` / `deleted_by`)** instead of `DELETE FROM`. This keeps history, makes the outbox able to ship a "delete this id" event to Solr after the fact, and lets us reuse the same row id if needed.
- **`TIMESTAMPTZ`** everywhere so timestamps round-trip correctly with the JVM's `Instant`. The PG JDBC driver returns `OffsetDateTime` for these; we normalize to `Instant` in the repository layer (see `JdbcTimes`).
- **`TEXT[]` arrays** for collections that don't justify a dedicated child table at MVP scale (`keywords`, `child_template_ids`, `related_intelligence_ids`).
- **`JSONB`** for `intelligence.attribute_values` so we can store dynamic, template-specific attribute payloads without a rigid schema. Indexed by GIN in V2.

The intelligence FK to template is `DEFERRABLE INITIALLY DEFERRED` so we can insert a template and intelligence in the same transaction without ordering gymnastics.

### V2 — `V2__indexes.sql` (read performance)

After tables exist, V2 adds the indexes the read paths rely on:

| Index | Type | Used by |
|-------|------|---------|
| `idx_intelligence_location` | GiST on `location` | `ST_Contains`, `ST_DWithin`, `ST_Intersects` (within-polygon, near) |
| `idx_intelligence_template_location` | GiST on `(template_id, location)` | template-scoped spatial queries |
| `idx_intelligence_last_modified_brin` | BRIN on `last_modified` | delta sync: very small index for an append-mostly column |
| `idx_intelligence_template_last_modified` | btree on `(template_id, last_modified)` | delta sync filtered by template |
| `idx_intelligence_active` | btree on `(template_id, last_modified) WHERE deleted = false` | active-only listings |
| `idx_intelligence_attribute_values_gin` | GIN on `attribute_values` | dynamic JSONB filters like `attribute_values ->> 'gender' = 'FEMALE'` |
| `idx_template_last_modified` *(partial)* | btree, active rows only | template list / delta |
| `idx_attribute_last_modified` *(partial)* | btree, active rows only | attribute list / delta |
| `idx_attribute_type_value_attribute_id` *(partial)* | btree | enum value lookups |

### V3 — `V3__outbox.sql` (sync queue)

```sql
CREATE TABLE intelligence_outbox (
    id            BIGSERIAL PRIMARY KEY,
    entity_type   TEXT NOT NULL,
    entity_id     TEXT NOT NULL,
    op            TEXT NOT NULL CHECK (op IN ('INSERT','UPDATE','DELETE')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at  TIMESTAMPTZ,
    attempt_count INT  NOT NULL DEFAULT 0,
    last_error    TEXT
);
CREATE INDEX idx_intelligence_outbox_unprocessed
    ON intelligence_outbox (created_at)
    WHERE processed_at IS NULL;
```

This is the heart of the **transactional outbox pattern** — see the next section.

### "Can I see the schema before connecting an app?"

Yes — Flyway is just SQL. After the first boot, connect with any PG client and run:

```sql
\dt
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

You will see exactly which scripts ran, when, and with which checksums.

---

## Domain model → SQL schema mapping

The Java domain types live in the sibling module [`osint-intelligence-model`](../osint-intelligence-model). They are plain mutable beans (`Intelligence`, `Template`, `Attribute`, `AttributeTypeValue`). The server module wraps them in immutable `record` DTOs (`IntelligenceDto`, `TemplateDto`, …) for transport and persistence.

Mapping (focusing on `Intelligence` since it is the richest table):

| Java field on `Intelligence` | SQL column on `intelligence` | SQL type | Notes |
|------------------------------|------------------------------|----------|-------|
| `id` | `id` | `TEXT PRIMARY KEY` | Application-generated UUID string |
| `version` | `version` | `BIGINT NOT NULL DEFAULT 0` | Optimistic-lock counter |
| `header` | `header` | `TEXT` | Free-text title |
| `description` | `description` | `TEXT` | Free-text body |
| `keywords` | `keywords` | `TEXT[]` | Postgres array, default `[]` |
| `attachedFileUniqueIdList` | `attached_file_unique_ids` | `TEXT[]` | Same |
| `location` | `location` | `GEOMETRY(Geometry, 4326)` | PostGIS, SRID 4326. Mapped to JTS `Geometry` via `JtsGeometryBinding` (sends `ST_GeomFromText(?, 4326)`, reads via `ST_AsText(?)`) |
| `relatedLocationList` | `related_locations` | `TEXT[]` of WKT | MVP simplification — no spatial index on the list, only on the primary `location` |
| `templateId` | `template_id` | `TEXT NOT NULL` | FK to `template(id)`, `DEFERRABLE INITIALLY DEFERRED` |
| `relatedIntelligenceIdList` | `related_intelligence_ids` | `TEXT[]` | Self-references |
| `attributeIdToAttributeValueMap` | `attribute_values` | `JSONB NOT NULL DEFAULT '{}'` | Keyed by `attributeId` in PG and Java; the outbox worker translates ids → names when writing to Solr |
| `createdAt` / `createdBy` / `lastModified` / `modifiedBy` | same | `TIMESTAMPTZ` / `TEXT` | Audit trail; `X-User` header on requests populates `*_by` |
| `deleted` / `deletedAt` / `deletedBy` | same | `BOOLEAN` / `TIMESTAMPTZ` / `TEXT` | Soft delete |

### How the Java code "sees" these tables

We deliberately do **not** run jOOQ codegen at build time (so the build does not need a running Postgres). Instead, [`Tables.java`](src/main/java/com/osint/intelligence/server/db/Tables.java) hand-writes the table and field references using the same naming jOOQ codegen would produce:

```java
public static final Table<?>            INTELLIGENCE          = DSL.table(DSL.name("intelligence"));
public static final Field<String>       INTELLIGENCE_ID       = field(INTELLIGENCE, "id", String.class);
public static final Field<Geometry>     INTELLIGENCE_LOCATION = DSL.field(DSL.name("intelligence","location"), GEOMETRY_TYPE);
public static final Field<Instant>      INTELLIGENCE_CREATED_AT = field(INTELLIGENCE, "created_at", Instant.class);
```

A few concrete bindings worth knowing about:

- **`GEOMETRY_TYPE`** — a `DataType<Geometry>` backed by `JtsGeometryBinding`, which encodes a JTS `Geometry` as WKT for both reads (`ST_AsText`) and writes (`ST_GeomFromText(?, 4326)`).
- **`InstantTypeHolder.INSTANT_TZ`** — a `DataType<Instant>` with a `Converter<OffsetDateTime, Instant>` so the values the PG driver returns (always `OffsetDateTime`) round-trip cleanly to `Instant`.
- **`JdbcTimes`** — defensive helper used in repository `map(Record record)` methods to coerce timestamps regardless of which JDBC type came back.

If/when you want generated jOOQ code instead, the Maven profile is wired up:

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml -Pjooq-codegen generate-sources -DskipTests
```

Generated types land under `target/generated-sources/jooq` in package `com.osint.intelligence.db.generated`. The hand-written constants in `Tables.java` use the same names, so you can migrate repositories to the generated `Tables` incrementally.

---

## Write pipeline: REST → Postgres → Outbox → Solr

Every endpoint that mutates `intelligence` follows the **transactional outbox pattern**. The point is to make "row written in PG" and "indexed in Solr" eventually consistent without distributed transactions and without losing events.

```
HTTP POST /api/intelligence
        │
        ▼
┌────────────────────────────────────────────────────┐
│ IntelligenceService.create(...)   @Transactional   │
│                                                     │
│   ┌──────────────────────┐   ┌──────────────────┐  │
│   │ INSERT into          │   │ INSERT into      │  │
│   │ intelligence         │   │ intelligence_    │  │
│   │ (jOOQ)               │   │ outbox           │  │
│   └──────────────────────┘   └──────────────────┘  │
│                  ↑ both happen in the SAME PG tx   │
└────────────────────────────────────────────────────┘
        │
        ▼
   COMMIT  ──────────────────────────────────────────────┐
                                                          │
                     (HTTP 201 returned to caller now)   │
                                                          │
                                                          ▼
                                       ┌──────────────────────────────┐
                                       │ OutboxWorker  (@Scheduled,   │
                                       │  fixedDelay=poll-millis=1s)  │
                                       │                              │
                                       │ 1. SELECT … FROM             │
                                       │    intelligence_outbox       │
                                       │    WHERE processed_at IS NULL│
                                       │    ORDER BY created_at, id   │
                                       │    FOR UPDATE SKIP LOCKED    │
                                       │    LIMIT batch-size          │
                                       │                              │
                                       │ 2. For each entry, build a   │
                                       │    SolrInputDocument via     │
                                       │    SolrIndexer (ids → names) │
                                       │                              │
                                       │ 3. solrClient.add(...)       │
                                       │    + solrClient.commit()     │
                                       │                              │
                                       │ 4. UPDATE intelligence_outbox│
                                       │    SET processed_at = now()  │
                                       │    WHERE id IN (...)         │
                                       │                              │
                                       │  Failure: bumps attempt_count│
                                       │  and stores last_error;      │
                                       │  retried up to               │
                                       │  intelligence.outbox.        │
                                       │  max-attempts                │
                                       └──────────────────────────────┘
```

Why this pattern:

- **Atomic with the row.** We never publish a Solr write for a row that didn't commit; the row insert and the outbox insert are in the same DB transaction. If anything rolls back, both go away.
- **At-least-once.** If the worker crashes before stamping `processed_at`, the next worker picks the same rows up. The Solr documents are upserts keyed by `id`, so duplicate processing is safe.
- **Concurrency-safe.** `FOR UPDATE SKIP LOCKED` lets multiple workers (across instances or even across threads) split the queue cleanly without contention.
- **Bounded-effort retries.** Failing entries record `attempt_count` and `last_error` so a poison message doesn't block forever — once it hits `max-attempts` (default 5) the worker stops retrying it.

You can drive the worker manually in tests via `OutboxWorker.processBatch()` (the test base class exposes a `drainOutbox()` helper that loops until `pendingCount() == 0`).

---

## Configuration reference

Defaults live in [`application.yml`](src/main/resources/application.yml). All values can be overridden via env vars or `-D` system properties.

| Setting | Default | Env var |
|---------|---------|---------|
| HTTP port | `8081` | `INTEL_SERVER_PORT` |
| DB JDBC URL | `jdbc:postgresql://localhost:5432/intelligence` | `INTEL_DB_URL` |
| DB user | `intelligence` | `INTEL_DB_USER` |
| DB password | `intelligence` | `INTEL_DB_PASSWORD` |
| Solr base URL | `http://localhost:8983/solr` | `INTEL_SOLR_BASE_URL` |
| Solr collection | `intelligence` | `INTEL_SOLR_COLLECTION` |
| Outbox poll interval | `1000ms` | `intelligence.outbox.poll-millis` |
| Outbox batch size | `100` | `intelligence.outbox.batch-size` |
| Outbox max attempts | `5` | `intelligence.outbox.max-attempts` |
| Combined-search Solr row cap | `5000` | `intelligence.combined-search.solr-row-cap` |
| Hikari pool name | `intel-hikari` | (constant) |
| Flyway location | `classpath:db/migration` | `spring.flyway.locations` |
| Flyway baseline-on-migrate | `true` | `spring.flyway.baseline-on-migrate` |

---

## Endpoints

All write endpoints accept an optional `X-User` header used for the `created_by` / `modified_by` audit columns (default `system`). Geometries are exchanged as **WKT** (SRID 4326).

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/intelligence?templateId=X&lastQueryTime=Y` | delta sync |
| `GET` | `/api/intelligence/{id}` | by id (404 if soft-deleted) |
| `POST` | `/api/intelligence` | create |
| `PUT` | `/api/intelligence/{id}` | update (optimistic-locked by `version`) |
| `DELETE` | `/api/intelligence/{id}?version=N` | soft delete |
| `POST` | `/api/intelligence/within-polygon` | `{ templateId?, polygonWkt }`, uses GiST + `ST_Contains` |
| `GET` | `/api/intelligence/near?lat=&lon=&km=&templateId=` | `ST_DWithin` over geography |
| `GET` | `/api/intelligence/search?q=...&templateId=` | Solr full-text |
| `GET` | `/api/intelligence/search/facets?templateId=&fields=...` | Solr facets |
| `POST` | `/api/intelligence/combined-search` | text (Solr) + polygon (PG) — runs both in parallel and intersects ids |
| `GET` `POST` `PUT` `DELETE` | `/api/templates`, `/api/attributes`, `/api/attributes/{id}/values` | reference data CRUD |
| `GET` | `/actuator/health`, `/actuator/info`, `/actuator/metrics` | ops |

---

## Tests

The module ships with two layers — a fast unit/repository layer (Surefire) and a full E2E layer (Failsafe).

### 1. Unit + repository tests — `mvn test`

Reuse Testcontainers `postgis/postgis:16-3.4` and mock the SolrJ client at the bean level.

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml test
```

### 2. End-to-end REST integration tests — `mvn verify`

Classes under `src/test/java/com/osint/intelligence/server/e2e/*IT.java` run in the `integration-test` phase. They:

- Bring up Postgres + PostGIS (`postgis/postgis:16-3.4`) in Docker via Testcontainers.
- Bring up Solr 9 (`solr:9.10.1`) in Docker, preloaded with the `intelligence` core configset copied from the sibling [`osint-intelligence-solr-server`](../osint-intelligence-solr-server/src/main/resources/conf) module.
- Boot the Spring Boot application **locally** on a random port (in the test JVM, not in Docker).
- Truncate the database tables and wipe the Solr index before every scenario so each test starts from a clean state.
- Send real HTTP/REST requests through RestAssured against every endpoint listed above.
- Tear down all containers + the application once the JVM exits.

Run them:

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml verify
```

If your Docker daemon is on another host, point Testcontainers at it before invoking Maven:

```powershell
$env:DOCKER_HOST = "tcp://192.168.1.60:2375"
$env:MAVEN_OPTS  = "-Djava.io.tmpdir=D:\tmp -Dmaven.repo.local=D:\m2-repo"
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml verify
```

To run a single E2E class:

```powershell
mvn -f .\osint-intelligence-modules\osint-intelligence-server\pom.xml -Dit.test=SearchE2EIT verify
```

Coverage map (every `*IT.java` under the `e2e/` package corresponds to a controller):

| File | Endpoints exercised |
|------|---------------------|
| `HealthE2EIT` | `/actuator/health`, `/actuator/info`, `/actuator/metrics` |
| `TemplateE2EIT` | `GET/POST/PUT/DELETE /api/templates`, `GET /api/templates/{id}` |
| `AttributeE2EIT` | `GET/POST/PUT/DELETE /api/attributes`, `GET /api/attributes/{id}`, `GET/POST /api/attributes/{id}/values`, `PUT/DELETE /api/attributes/values/{valueId}` |
| `IntelligenceE2EIT` | `GET/POST/PUT/DELETE /api/intelligence`, `GET /api/intelligence/{id}`, delta sync via `GET /api/intelligence?templateId=&lastQueryTime=` |
| `GeoE2EIT` | `POST /api/intelligence/within-polygon`, `GET /api/intelligence/near` |
| `SearchE2EIT` | `GET /api/intelligence/search`, `GET /api/intelligence/search/facets`, `POST /api/intelligence/combined-search` |

---

## Layout

```
osint-intelligence-server/
├── pom.xml
├── README.md                            ← you are here
├── DesignAndImplementationDetail.md     ← architecture deep-dive
└── src/
    ├── main/
    │   ├── java/com/osint/intelligence/server/
    │   │   ├── IntelligenceServerApplication.java
    │   │   ├── api/                — REST controllers + request/response DTOs
    │   │   ├── config/             — Spring config (Solr, CORS, properties)
    │   │   ├── db/                 — jOOQ table refs (Tables.java),
    │   │   │                         JtsGeometryBinding, JdbcTimes, JsonbSupport
    │   │   ├── dto/                — internal DTOs and outbox enums
    │   │   ├── error/              — exceptions mapped to HTTP statuses
    │   │   ├── outbox/             — OutboxWorker (@Scheduled)
    │   │   ├── repository/         — jOOQ repositories
    │   │   └── service/            — orchestration (IntelligenceService,
    │   │                              CombinedSearchService, SolrIndexer, …)
    │   └── resources/
    │       ├── application.yml
    │       ├── logback-spring.xml
    │       └── db/migration/       — V1__schema, V2__indexes, V3__outbox
    └── test/
        └── java/com/osint/intelligence/server/
            ├── *Test.java          — Surefire unit/repository tests
            └── e2e/*IT.java        — Failsafe E2E REST tests
```
