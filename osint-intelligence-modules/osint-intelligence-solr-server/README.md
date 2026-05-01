# osint-intelligence-solr-server

Build and run instructions for the Solr `intelligence` core used by the Intelligence module, locally or in Docker.

For design, Maven plugin flows, and Docker internals, see [DesignAndImplementationDetail.md](DesignAndImplementationDetail.md).

## Requirements

- **Java 21** (example: isolated toolchain from repo root `osint-tools`)

  ```powershell
  cd D:\osint
  . .\osint-tools\env.ps1
  java -version   # expect 21.x
  mvn -version
  ```

- **Maven 3.9+**
- **Network** (first build downloads the Solr `.tgz` from the archive; a cache is used)
- **Docker** (only if you build the image with `-Pdeployment`)

## Quick start (local)

### 1. `SOLR_HOME` (persistent data and instance)

`SOLR_HOME` is the directory where the core and indexes live; `mvn clean` does **not** remove it.

PowerShell (persistent, for new sessions):

```powershell
setx SOLR_HOME "D:\path\to\solr-home"
```

Current session only:

```powershell
$env:SOLR_HOME = "D:\path\to\solr-home"
```

bash/zsh:

```bash
export SOLR_HOME="$HOME/solr-home"
```

### 2. One-time: `conf/` baseline from the distro

Apache Solr 9.x ships only as a `.tgz`. The command below downloads and unpacks the distro and copies `server/solr/configsets/_default/conf` into `src/main/resources/conf/` (suitable to commit).

```powershell
cd D:\osint\osint-intelligence-modules\osint-intelligence-solr-server
mvn process-resources -Pseed-conf
```

### 3. Build (jar + distro unpack + `SOLR_HOME` sync)

```powershell
mvn package
```

- If `SOLR_HOME` is not set, the build fails at `process-resources` (fail-fast). To skip sync temporarily: `mvn package -Dsync.home.skip=true`
- If `src/main/resources/conf/solrconfig.xml` is missing, run the `seed-conf` step first.

### 4. Start / stop Solr

```powershell
mvn exec:exec@solr-start
mvn exec:exec@solr-stop
```

- On Windows the POM automatically uses `solr.cmd`.
- Default port: **8983** (override with `solr.port`).

### 5. Smoke checks

Browser or HTTP client:

- Admin: `http://localhost:8983/solr/admin/info/system`
- Core: `http://localhost:8983/solr/intelligence/select?q=*:*&wt=json`

## Docker (deployment profile)

Build the shaded jar + `Dockerfile` image:

```powershell
mvn -Pdeployment package
```

Default image name: `osint-intelligence-solr-server:0.1.0` (aligned with `docker.image.name` and `project.version`).

Run:

```powershell
docker run -p 8983:8983 osint-intelligence-solr-server:0.1.0
```

Inside the container, `run-app.sh` runs the credential jar with the **Java 21 JRE added by the Dockerfile** (`JAVA_CREDENTIALS`, default `/opt/osint/jre-21/bin/java`); Solr itself starts via `solr-foreground` using the official image JVM. Details: [DesignAndImplementationDetail.md](DesignAndImplementationDetail.md).

**Note:** If you see `UnsupportedClassVersionError` (61 vs 65), rebuild the image with this Dockerfile; older images do not include the Java 21 layer.

## Command cheat sheet

| Goal | Command |
|------|---------|
| Conf baseline (one-time) | `mvn process-resources -Pseed-conf` |
| Full build + `SOLR_HOME` sync | `mvn package` |
| Skip sync | `mvn package -Dsync.home.skip=true` |
| Start Solr | `mvn exec:exec@solr-start` |
| Stop Solr | `mvn exec:exec@solr-stop` |
| Docker image | `mvn -Pdeployment package` |

## Maven properties

| Property | Default | Description |
|----------|---------|-------------|
| `solr.version` | `9.10.1` | Distro download + Docker `FROM solr:...` |
| `solr.core.name` | `intelligence` | Core name |
| `solr.port` | `8983` | Local start/stop port |
| `docker.image.name` | `osint-intelligence-solr-server` | Docker image name |

## Frontend alignment

`osint-intelligence-web` default Solr URL:

`http://localhost:8983/solr/intelligence` — the core name must stay `intelligence`.

## Troubleshooting

- **`SOLR_HOME ... not found` (stop):** Set `$env:SOLR_HOME` in the same session for stop; after `setx`, open a new shell.
- **First `solr-start` is slow:** `exec-maven-plugin` and Solr may download / cold-start the JVM; later runs are faster.
- **Port in use:** If another process uses 8983, change `solr.port` or stop the other process.
