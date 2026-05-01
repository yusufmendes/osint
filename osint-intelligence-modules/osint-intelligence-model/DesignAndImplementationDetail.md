# Design and implementation detail — `osint-intelligence-model`

This document is the **authoritative design note** for the **as-built** Java domain module under `osint-intelligence-modules/osint-intelligence-model` (field names, semantics, and toolchain). The **`com.osint.intelligence.model`** types and their Javadoc are the executable contract. Entity types are **mutable JavaBeans** (not records) so the same instance can be updated incrementally and held in a cache without rebuilding the whole aggregate on each change.

## Goals

- Provide a **reusable, dependency-light JAR** of intelligence domain types for backends, indexing, or other JVM services.
- Encode the four entity shapes plus **AttributeType** in a single package as **mutable** domain beans suitable for incremental edits and cache-backed use.
- Use **Java 21** and **Maven 3.9.x** from the repo toolchain ([`osint-tools/env.ps1`](../../osint-tools/env.ps1); JDK/Maven under `D:\osint\osint-tools\.tools\`).

## Maven coordinates and build

| Item | Value |
|------|--------|
| `groupId` | `com.osint.intelligence` |
| `artifactId` | `osint-intelligence-model` |
| `version` | `0.1.0` |
| `packaging` | `jar` |
| Parent POM | None (standalone module, same style as `osint-intelligence-solr-server`) |
| Java release | **21** (`maven-compiler-plugin` **3.13.0**, `<release>21</release>`) |

### Dependencies

| Dependency | Role |
|------------|------|
| [`org.locationtech.jts:jts-core`](https://github.com/locationtech/jts) **1.19.0** | Typed **Geometry** on **Intelligence** (`location`, `relatedLocationList`). |

No Spring, JPA, or Solr — the module is **pure domain types**.

## Package and layout

Java sources live in **`com.osint.intelligence.model`**:

```
src/main/java/com/osint/intelligence/model/
├── AttributeType.java
├── AttributeTypeValue.java
├── Attribute.java
├── Template.java
└── Intelligence.java
```

The repository root for this artifact also includes **`pom.xml`**, **`.gitignore`**, and this **`DesignAndImplementationDetail.md`**.

## Common audit and soft-delete fields

Every entity (`AttributeTypeValue`, `Attribute`, `Template`, `Intelligence`) carries the same audit and soft-delete fields. They are owned by the Java model so they are visible to every consumer of the JAR (cache, persistence, API, Solr translator):

| Field | Type | Notes |
|-------|------|-------|
| `version` | `long` | optimistic-lock counter; bumped on every update |
| `createdAt` | `Instant` | first-write timestamp (UTC) |
| `createdBy` | `String` | first-write actor |
| `lastModified` | `Instant` | latest write timestamp; **delta sync filter key** |
| `modifiedBy` | `String` | latest write actor |
| `deleted` | `boolean` | soft-delete tombstone |
| `deletedAt` | `Instant` | when soft-delete happened (nullable) |
| `deletedBy` | `String` | who deleted (nullable) |

Setters are simple JavaBean setters; the persistence layer is responsible for stamping these on insert and update. Soft delete is performed by setting `deleted = true`, `deletedAt = now`, `deletedBy = user`, and bumping `lastModified` so delta sync surfaces the tombstone.

## Types

### `AttributeType` (enum)

Values: **STRING**, **NUMBER**, **BOOLEAN**, **ENUM**, **GEOMETRY**, **DATE**, **ENUM_LIST**, **GEOMETRY_LIST**, **DATE_LIST**.

Multi-select enumeration uses **ENUM_LIST**.

### `AttributeTypeValue` (class)

Standard getters/setters; no-arg and all-args constructors. Fields: **`id`**, **`version`**, **`value`**, **`attributeId`**, plus the audit + soft-delete fields above.

### `Attribute` (class)

| Field | Type | Notes |
|-------|------|--------|
| `id` | `String` | Stable identifier |
| `name` | `String` | Human-readable name |
| `attributeType` | `AttributeType` | Logical type |
| `attributeValueTypeIdList` | `List<String>` | Live mutable list (`ArrayList`); ids of **AttributeTypeValue** rows — used **only** for **ENUM** and **ENUM_LIST** attributes |

`attributeValueTypeIdList` is **populated** when `attributeType` is **ENUM** or **ENUM_LIST**, **typically empty** for all other types.

### `Template` (class)

| Field | Type |
|-------|------|
| `id` | `String` |
| `name` | `String` |
| `childTemplateIdList` | `List<String>` |
| `attributeIdList` | `List<String>` |

Backing `ArrayList`s; `set…List` replaces contents from a copy of the argument (or clears on `null`).

### `Intelligence` (class)

| Field | Type | Notes |
|-------|------|--------|
| `id` | `String` | Stable identifier |
| `header` | `String` | Short title |
| `description` | `String` | Body text |
| `keywords` | `List<String>` | Free-text keywords |
| `attachedFileUniqueIdList` | `List<String>` | Opaque file ids from a storage layer |
| `location` | `Geometry` | JTS `org.locationtech.jts.geom.Geometry`; **nullable** |
| `relatedLocationList` | `List<Geometry>` | Additional geometries |
| `templateId` | `String` | **Template** id |
| `relatedIntelligenceIdList` | `List<String>` | Related intelligence ids |
| `attributeIdToAttributeValueMap` | `Map<String, Object>` | Live `HashMap` from `getAttributeIdToAttributeValueMap()` — use `put`, `remove`, etc. in place |

**`attributeIdToAttributeValueMap` representation rule**

| Layer | Key | Value when AttributeType is enum | Value otherwise |
|-------|-----|----------------------------------|-----------------|
| Java memory | `Attribute.id` | `AttributeTypeValue.id` | raw scalar |
| Postgres JSONB | `Attribute.name` | `AttributeTypeValue.value` | raw scalar |
| Solr dynamic field | `Attribute.name + suffix` | `AttributeTypeValue.value` | raw scalar |

The outbox worker is the only place that performs the `id -> name` translation when writing to JSONB / Solr.

`location` may be `null`. List/map setters clear and repopulate from the argument when non-`null`; they are not thread-safe.

**Caching:** the module does not implement a cache; use your cache library keyed by entity `id` (or hold references) and mutate the same bean instance as needed. For concurrent access, synchronise or copy out of the cache.

## Cross-stack naming

- **Java** uses the names in this document and in the classes under `com.osint.intelligence.model` (camelCase with getters/setters).
- The web domain type may still use `tags` for keywords; aligning TS/OpenAPI is **out of scope** for the JAR itself.

## Verification

From the repo root (after `.\osint-tools\env.ps1` on Windows so `JAVA_HOME` is JDK 21):

```powershell
mvn -f osint-intelligence-modules/osint-intelligence-model/pom.xml package
```

There is no `src/test/java` tree in this module at present.
