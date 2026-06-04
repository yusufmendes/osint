# bootstrap.ps1
# Downloads an isolated toolchain (JDK 21, Apache Maven 3.9.15, Node.js LTS,
# Docker CLI 29.4.2)
# into the project-local .tools/ directory. Nothing from the host PATH is used.
#
# Usage:
#   pwsh -ExecutionPolicy Bypass -File .\bootstrap.ps1            # only downloads what's missing
#   pwsh -ExecutionPolicy Bypass -File .\bootstrap.ps1 -Force     # re-downloads everything
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root  = $PSScriptRoot
$tools = Join-Path $root '.tools'
$dl    = Join-Path $tools '_downloads'
New-Item -ItemType Directory -Force -Path $tools, $dl | Out-Null

function Download-File {
    param([string]$Url, [string]$OutFile)
    if (Test-Path $OutFile) {
        Write-Host "  cached: $OutFile"
        return
    }
    Write-Host "  downloading: $Url"
    $tmp = "$OutFile.part"
    Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing -MaximumRedirection 10
    Move-Item -Path $tmp -Destination $OutFile -Force
}

function Extract-Zip-FlatRename {
    param([string]$Zip, [string]$DestDir)
    $tempDir = "$DestDir.tmp"
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    if (Test-Path $DestDir) { Remove-Item $DestDir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    Write-Host "  extracting: $Zip"
    Expand-Archive -Path $Zip -DestinationPath $tempDir -Force
    $children = @(Get-ChildItem -Force $tempDir)
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
        Move-Item -Path $children[0].FullName -Destination $DestDir
        Remove-Item $tempDir -Recurse -Force
    } else {
        Move-Item -Path $tempDir -Destination $DestDir
    }
}

# ------------------------------------------------------------------
# 1) Eclipse Temurin JDK 21 (Windows x64, ZIP)
# ------------------------------------------------------------------
$jdkDir = Join-Path $tools 'jdk-21'
if ($Force -or -not (Test-Path (Join-Path $jdkDir 'bin\java.exe'))) {
    Write-Host "[1/4] Eclipse Temurin JDK 21"
    $jdkZip = Join-Path $dl 'jdk-21.zip'
    $jdkUrl = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk'
    Download-File -Url $jdkUrl -OutFile $jdkZip
    Extract-Zip-FlatRename -Zip $jdkZip -DestDir $jdkDir
} else {
    Write-Host "[1/4] JDK 21 already present at $jdkDir"
}

# ------------------------------------------------------------------
# 2) Apache Maven 3.9.15
# ------------------------------------------------------------------
$mavenDir = Join-Path $tools 'maven-3.9.15'
if ($Force -or -not (Test-Path (Join-Path $mavenDir 'bin\mvn.cmd'))) {
    Write-Host "[2/4] Apache Maven 3.9.15"
    $mavenZip = Join-Path $dl 'apache-maven-3.9.15-bin.zip'
    $mavenUrls = @(
        'https://dlcdn.apache.org/maven/maven-3/3.9.15/binaries/apache-maven-3.9.15-bin.zip',
        'https://archive.apache.org/dist/maven/maven-3/3.9.15/binaries/apache-maven-3.9.15-bin.zip'
    )
    $ok = $false
    foreach ($u in $mavenUrls) {
        try { Download-File -Url $u -OutFile $mavenZip; $ok = $true; break } catch { Write-Warning "  failed: $u : $($_.Exception.Message)" }
    }
    if (-not $ok) { throw 'Could not download Apache Maven 3.9.15' }
    Extract-Zip-FlatRename -Zip $mavenZip -DestDir $mavenDir
} else {
    Write-Host "[2/4] Maven 3.9.15 already present at $mavenDir"
}

# ------------------------------------------------------------------
# 3) Node.js latest LTS (Windows x64, ZIP)
# ------------------------------------------------------------------
$nodeDir = Join-Path $tools 'node'
if ($Force -or -not (Test-Path (Join-Path $nodeDir 'node.exe'))) {
    Write-Host "[3/4] Node.js LTS"
    $idx = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing
    $lts = $idx | Where-Object { $_.lts } | Select-Object -First 1
    if (-not $lts) { throw 'Could not determine the current Node.js LTS' }
    $nodeVersion = $lts.version
    Write-Host "  resolved LTS = $nodeVersion ($($lts.lts))"
    $zipName = "node-$nodeVersion-win-x64.zip"
    $nodeZip = Join-Path $dl $zipName
    $nodeUrl = "https://nodejs.org/dist/$nodeVersion/$zipName"
    Download-File -Url $nodeUrl -OutFile $nodeZip
    Extract-Zip-FlatRename -Zip $nodeZip -DestDir $nodeDir
} else {
    Write-Host "[3/4] Node already present at $nodeDir"
}

$pnpmHome = Join-Path $tools 'pnpm-store'
$pnpmCmd = Join-Path $pnpmHome 'pnpm.CMD'
$nodeExe = Join-Path $nodeDir 'node.exe'
$corepackCli = Join-Path $nodeDir 'node_modules\corepack\dist\corepack.js'
New-Item -ItemType Directory -Force -Path $pnpmHome | Out-Null

if ($Force -or -not (Test-Path $pnpmCmd)) {
    Write-Host "[pnpm] Enabling Corepack shims at $pnpmHome"
    & $nodeExe $corepackCli enable --install-directory $pnpmHome
}

# Corepack's Windows shims use a sibling node.exe when present; otherwise they
# fall back to PATH. Keep IntelliJ/npm run configs pinned to the project Node.
$pnpmNode = Join-Path $pnpmHome 'node.exe'
if ($Force -or -not (Test-Path $pnpmNode)) {
    if (Test-Path $pnpmNode) { Remove-Item $pnpmNode -Force }
    try {
        New-Item -ItemType HardLink -Path $pnpmNode -Target $nodeExe | Out-Null
    } catch {
        Copy-Item -Path $nodeExe -Destination $pnpmNode -Force
    }
}

# ------------------------------------------------------------------
# 4) Docker CLI 29.4.2 (Windows x64, ZIP)
# ------------------------------------------------------------------
$dockerCliVersion = '29.4.2'
$dockerCliDir = Join-Path $tools "docker-cli-$dockerCliVersion"
if ($Force -or -not (Test-Path (Join-Path $dockerCliDir 'docker.exe'))) {
    Write-Host "[4/4] Docker CLI $dockerCliVersion"
    $dockerCliZip = Join-Path $dl "docker-$dockerCliVersion.zip"
    $dockerCliUrl = "https://download.docker.com/win/static/stable/x86_64/docker-$dockerCliVersion.zip"
    Download-File -Url $dockerCliUrl -OutFile $dockerCliZip
    Extract-Zip-FlatRename -Zip $dockerCliZip -DestDir $dockerCliDir
} else {
    Write-Host "[4/4] Docker CLI $dockerCliVersion already present at $dockerCliDir"
}

Write-Host ""
Write-Host "Toolchain ready under $tools"
Write-Host "  JAVA_HOME  = $jdkDir"
Write-Host "  MAVEN_HOME = $mavenDir"
Write-Host "  NODE_HOME  = $nodeDir"
Write-Host "  DOCKER_CLI_HOME = $dockerCliDir"
Write-Host "  PNPM_HOME  = $pnpmHome"
Write-Host ""
Write-Host "Activate it for the current shell with: . .\env.ps1"
