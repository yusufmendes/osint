# Design and implementation detail — osint-intelligence-solr-server

This document summarizes the module design, Maven/Docker flows, and differences between local and container environments. For build and run commands, see [README.md](README.md).

## Goals

- **Local development:** Keep the Solr binary distro only under **`target/`**; keep index and instance layout under the **`SOLR_HOME` environment variable** in a user-chosen persistent directory (`mvn clean` does not delete indexes).
- **Docker:** Pin credential generation and Solr startup via `run-app.sh` on top of the official `solr` image.

## Source requirements document

Original requirements: `osint-intelligence-modules/isr-intelligence-solr-server.md` (sibling path may vary). Technical decisions taken during implementation:

- Solr 9.x **binary is not published as a zip on Maven Central**; the official archive `.tgz` is used (`download-maven-plugin` + `unpack=true`).
- **No extra credential file** in the default profile; Solr uses factory security (typically no Basic Auth).
- `src/main/resources/conf/` is seeded from the distro’s `server/solr/configsets/_default/conf` (`-Pseed-conf`).

## Module layout

```
osint-intelligence-modules/osint-intelligence-solr-server/
├── pom.xml
├── Dockerfile
├── run-app.sh
├── README.md
├── DesignAndImplementationDetail.md
└── src/main/
    ├── java/com/osint/intelligence/solr/config/SolrCredentialFetcher.java
    └── resources/
        ├── core.properties              (name=intelligence)
        └── conf/                        (from _default via seed-conf)
            ├── solrconfig.xml
            ├── managed-schema.xml
            └── ...
```

## Two operating modes

### A) Default profile (local)

| Component | Role |
|-----------|------|
| `download-maven-plugin` | Download `solr.distro.url` (.tgz) and unpack under `target/` |
| `maven-antrun` `sync-home` | Copy `src/main/resources/conf/**` and `core.properties` → `${SOLR_HOME}/${solr.core.name}/`; copy distro `server/solr/solr.xml` → `${SOLR_HOME}/solr.xml` (only if missing) |
| `maven-shade-plugin` | Single jar; Main-Class: `SolrCredentialFetcher` (for Docker) |
| `exec-maven-plugin` | `bin/solr start -p <port> -s <SOLR_HOME>` / `stop -p <port>` |

**Data safety:** `sync-home` overwrites only `conf/` and `core.properties`; it does not touch existing `data/` or index files.

**Fail-fast:**

- If `SOLR_HOME` is unset, `sync-home` fails.
- If `src/main/resources/conf/solrconfig.xml` is missing, fail before seed.

### B) `deployment` profile (Docker)

| Aspect | Value |
|--------|--------|
| `unpack.solr.skip` | `true` — no local distro download |
| `sync.home.skip` | `true` — no local `SOLR_HOME` sync |
| `docker-maven-plugin` | `docker:build` in `package`; build context is module root, `Dockerfile` |

Inside the image:

1. Shaded jar at `/opt/osint/osint-intelligence-solr-server.jar`
2. `run-app.sh` as entrypoint
3. `SolrCredentialFetcher` writes `/tmp/solr-credentials` with `SOLR_USER=admin`, `SOLR_PASS=123` (shell-friendly)
4. The script reads those lines, exports them, then `exec solr-foreground` starts Solr

**Note:** Solr does not natively read `/tmp/solr-credentials`; the shell layer maps credentials into the environment (can be extended later with `SOLR_OPTS` or `security.json`).

## Dockerfile summary

- `ARG SOLR_VERSION` / `FROM solr:${SOLR_VERSION}` — keep aligned with POM `solr.version`.
- **Two JVMs:** The official Solr image usually ships **Java 17** (enough for Solr). The shaded `SolrCredentialFetcher` jar is built with **Java 21** (`--release 21`, class file **65**). Running it with the image `java` causes `UnsupportedClassVersionError`. **Fix:** multi-stage copy from `eclipse-temurin:21-jre`: `/opt/java/openjdk` → `/opt/osint/jre-21`; `run-app.sh` uses only `JAVA_CREDENTIALS` (`/opt/osint/jre-21/bin/java`) for the credential step. `solr-foreground` continues to use the image JVM via Solr’s scripts.
- `ARG CREDENTIALS_JAVA_IMAGE` (default `eclipse-temurin:21-jre`) lets you override the JRE source at build time.
- `USER root`: copy JRE 21, jar, `conf/`, `core.properties`, `run-app.sh`; place core under `/var/solr/data/${SOLR_CORE_NAME}`.
- User: use `solr` if present in the official image; otherwise create `isr` (per original spec).

## `SolrCredentialFetcher`

- Package: `com.osint.intelligence.solr.config`
- `main`: first argument is output path; default `/tmp/solr-credentials`
- Output format: `SOLR_USER=...` and `SOLR_PASS=...` (one assignment per line)

## Maven profiles

| Profile | Trigger | Effect |
|---------|---------|--------|
| `windows` | OS family | `solr.bin=solr.cmd` |
| `seed-conf` | `-Pseed-conf` | Runs `seed-conf` antrun; skips `sync-home` in that phase |
| `deployment` | `-Pdeployment` | Skips distro fetch + sync; Docker build |

## External dependencies and pinned versions

- Solr binary: `https://archive.apache.org/dist/solr/solr/${solr.version}/solr-${solr.version}.tgz`
- Plugin pins (POM): `maven-compiler-plugin` 3.13.0, `maven-shade-plugin` 3.6.0, `maven-antrun-plugin` 3.1.0, `exec-maven-plugin` 3.5.0, `download-maven-plugin` 1.13.0, `docker-maven-plugin` (fabric8) 0.46.0

## Known limits and future notes

- **Solr 10:** CLI warns that SolrCloud may become the default; standalone may need flags such as `--user-managed` — update `exec` arguments when upgrading.
- **Security:** `admin`/`123` is scaffolding only; production needs real identity and `security.json` / plugin configuration.
- **JDK:** POM uses `release=21`; building with an older JDK fails.

## Verification checklist (developer)

1. `mvn process-resources -Pseed-conf` — `src/main/resources/conf` populated
2. `SOLR_HOME` set + `mvn package` — sync succeeds
3. `mvn exec:exec@solr-start` — port 8983 up
4. `GET /solr/intelligence/select?q=*:*` — HTTP 200
5. `mvn exec:exec@solr-stop` — process stops
6. `mvn -Pdeployment package` — Docker image produced (Docker daemon required)
