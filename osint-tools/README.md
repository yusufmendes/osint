# osint-tools

Shared isolated toolchain for all sibling repos. Does not modify the host machine.

## Setup

```powershell
# From workspace root
cd osint-tools
.\bootstrap.ps1
```

This downloads and extracts under `osint-tools/.tools/`:

- JDK 21 (Eclipse Temurin)
- Apache Maven 3.9.x
- Node.js 22 LTS
- pnpm 10.x

Nothing is written to the global host `PATH`.

## Usage

In a new PowerShell session:

```powershell
. .\osint-tools\env.ps1
```

`JAVA_HOME`, `MAVEN_HOME`, `NODE_HOME`, `PNPM_HOME`, and `PNPM_STORE_PATH` are set, and isolated `bin` directories are prepended to `PATH`. After that:

```powershell
java -version    # 21.x
mvn  -v          # 3.9.x
node -v          # 22.x
pnpm -v          # 10.x
```

## Versions

`bootstrap.ps1` accepts version/URL parameters; to override defaults:

```powershell
.\bootstrap.ps1 -MavenVersion 3.9.15 -MavenUrl https://archive.apache.org/dist/maven/maven-3/3.9.15/binaries/apache-maven-3.9.15-bin.zip
```

## Reinstall

```powershell
.\bootstrap.ps1 -Force
```
