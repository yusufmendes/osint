# Design and implementation detail — `osint-intelligence-model`

This document is the **authoritative design note** for the **as-built** Java domain module under `osint-intelligence-modules/osint-intelligence-model` (field names, semantics, and toolchain). The **`com.osint.intelligence.model`** types and their Javadoc are the executable contract.

## Goals

- Provide a **reusable, dependency-light JAR** of intelligence domain types for backends, indexing, or other JVM services.
- Encode the four entity shapes plus **AttributeType** in a single package with **immutable** defaults suitable for APIs and messaging.
- Use **Java 21** and **Maven 3.9.x** from the repo toolchain ([`osint-tools/env.ps1`](../../osint-tools/env.ps1); JDK/Maven under `D:\osint\osint-tools\.tools\`).

## Maven coordinates and build

| Item | Value |
|------|--------|
| `groupId` | `com.osint.intelligence` |
| `artifactId` | `osint-intelligence-model` |
| `version` | `0.1.0` |
| `packaging` | `jar` |
| Parent POM | **None** (standalone module, same style as `osint-intelligence-solr-server`) |
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

## Types

### `AttributeType` (enum)

Values: **STRING**, **NUMBER**, **BOOLEAN**, **ENUM**, **GEOMETRY**, **DATE**, **ENUM_LIST**, **GEOMETRY_LIST**, **DATE_LIST**.

Multi-select enumeration uses **ENUM_LIST**.

### `AttributeTypeValue` (record)

| Field | Type | Notes |
|-------|------|--------|
| `id` | `String` | Stable identifier |
| `version` | `long` | Revision / optimistic-lock style counter |
| `value` | `String` | Serialized value; interpretation depends on parent **AttributeType** |
| `attributeId` | `String` | Owning attribute id |

### `Attribute` (record)

| Field | Type | Notes |
|-------|------|--------|
| `id` | `String` | Stable identifier |
| `version` | `long` | Revision counter |
| `name` | `String` | Human-readable name |
| `attributeType` | `AttributeType` | Logical type |
| `attributeValueTypeIdList` | `List<String>` | Ids of **AttributeTypeValue** rows that define allowed enum options — used **only** for **ENUM** and **ENUM_LIST** attributes |

**`attributeValueTypeIdList` semantics (implementation):**

- **Populated** when `attributeType` is **ENUM** or **ENUM_LIST** (the list references **AttributeTypeValue** rows for the allowed values, including multi-select when the type is **ENUM_LIST**).
- **Typically empty** for **STRING**, **NUMBER**, **BOOLEAN**, **GEOMETRY**, **DATE**, **GEOMETRY_LIST**, and **DATE_LIST** — those types do not use this list to hang enumerated options off the attribute definition.
- Concrete values on an intelligence instance still use **`Intelligence.attributeIdToAttributeValueMap`** (or persistence), depending on the service layer.

The record’s compact constructor treats a **null** list as **`List.of()`** and otherwise applies **`List.copyOf`** for an immutable copy.

### `Template` (record)

| Field | Type |
|-------|------|
| `id` | `String` |
| `version` | `long` |
| `name` | `String` |
| `childTemplateIdList` | `List<String>` |
| `attributeIdList` | `List<String>` |

**Null handling:** `null` lists are stored as empty immutable lists; non-null arguments are copied with **`List.copyOf`**.

### `Intelligence` (record)

| Field | Type | Notes |
|-------|------|--------|
| `id` | `String` | Stable identifier |
| `version` | `long` | Revision counter |
| `header` | `String` | Short title |
| `description` | `String` | Body text |
| `keywords` | `List<String>` | Keywords / tags (**spec name**; some TS types may still say `tags`) |
| `attachedFileUniqueIdList` | `List<String>` | Opaque file ids from a storage layer |
| `location` | `Geometry` | JTS **`org.locationtech.jts.geom.Geometry`**; **nullable** |
| `relatedLocationList` | `List<Geometry>` | Additional geometries |
| `templateId` | `String` | **Template** id |
| `relatedIntelligenceIdList` | `List<String>` | Related intelligence ids |
| `attributeIdToAttributeValueMap` | `Map<String, Object>` | Key = **Attribute** id; value = API-defined payload (primitives, strings, nested maps, etc.) |

**Null handling:** all **list** and **map** fields normalize **null** to empty immutable collections and copy non-null inputs with **`List.copyOf`** / **`Map.copyOf`**. **`location`** is **not** defaulted; it may be **null**.

## Cross-stack naming

- **Java** uses the names in this document and in the records under **`com.osint.intelligence.model`** (e.g. **`keywords`**, **`attachedFileUniqueIdList`**, camelCase field names).
- The web domain type may still use **`tags`** in TypeScript; aligning TS/OpenAPI with this module is **out of scope** for the JAR itself.

## Verification

From the repo root (after `.\osint-tools\env.ps1` on Windows so **`JAVA_HOME`** is JDK 21):

```powershell
mvn -f osint-intelligence-modules/osint-intelligence-model/pom.xml package
```

There is no **`src/test/java`** tree in this module at present; **`mvn test`** therefore does not run unit tests here.

## Optional follow-ups

- Add this module to a parent **`osint-intelligence-modules`** aggregator POM.
- Add a minimal **`src/test/java`** smoke test (compile + sanity constructor) if desired.
- Wire the JAR into **`osint-intelligence-backend`** and align REST/OpenAPI and TS types with **`keywords`** and geometry representation.
