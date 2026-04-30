# osint-tools

Tum sibling repo'larin paylastigi izole toolchain. Host makineye dokunmaz.

## Kurulum

```powershell
# Workspace root'tan
cd osint-tools
.\bootstrap.ps1
```

Bu komut sirasiyla `~/.tools/` altina:

- JDK 21 (Eclipse Temurin)
- Apache Maven 3.9.x
- Node.js 22 LTS
- pnpm 10.x

indirir ve hicbir sey host PATH'ine yazmaz.

## Kullanim

Yeni bir PowerShell oturumunda:

```powershell
. .\osint-tools\env.ps1
```

`JAVA_HOME`, `MAVEN_HOME`, `NODE_HOME`, `PNPM_HOME`, `PNPM_STORE_PATH` set
edilir; `PATH`'in basina izole bin klasorleri eklenir. Bu noktadan sonra:

```powershell
java -version    # 21.x
mvn  -v          # 3.9.x
node -v          # 22.x
pnpm -v          # 10.x
```

## Sürümler

`bootstrap.ps1` parametre olarak sürüm/URL alir; varsayilanlari override
etmek icin:

```powershell
.\bootstrap.ps1 -MavenVersion 3.9.15 -MavenUrl https://archive.apache.org/dist/maven/maven-3/3.9.15/binaries/apache-maven-3.9.15-bin.zip
```

## Yeniden kurulum

```powershell
.\bootstrap.ps1 -Force
```
