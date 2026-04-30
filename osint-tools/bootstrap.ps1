<#
.SYNOPSIS
  osint-tools bootstrap — host makineye dokunmadan izole bir toolchain kurar.

.DESCRIPTION
  Bu script JDK 21 (Eclipse Temurin), Apache Maven, Node.js LTS ve pnpm'i
  osint-tools/.tools/ altına indirip açar. Hiçbir kurulum host PATH'ini
  veya registry'sini değiştirmez.

  Tamamlandıktan sonra her shell'de `. .\osint-tools\env.ps1` ile bu izole
  toolchain'e bağlanılır.

.PARAMETER Force
  Önbellek/extract klasörlerini silip baştan indirir.

.NOTES
  Sürümler doc'taki "Sürüm kuralı"na göre seçilmiştir: en güncel stabil ve
  birbirleriyle uyumlu sürümler. Sürüm güncellemek istersen aşağıdaki
  parametreleri override et.
#>

[CmdletBinding()]
param(
    [switch]$Force,
    [string]$JdkVersion       = "21.0.5+11",
    [string]$JdkUrl           = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_windows_hotspot_21.0.5_11.zip",
    [string]$MavenVersion     = "3.9.9",
    [string]$MavenUrl         = "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip",
    [string]$NodeVersion      = "22.13.0",
    [string]$NodeUrl          = "https://nodejs.org/dist/v22.13.0/node-v22.13.0-win-x64.zip",
    [string]$PnpmVersion      = "10.4.0",
    [string]$PnpmUrl          = "https://github.com/pnpm/pnpm/releases/download/v10.4.0/pnpm-win-x64.exe"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$ProgressPreference = "SilentlyContinue"

$ToolsRoot = Join-Path $PSScriptRoot ".tools"
$CacheRoot = Join-Path $ToolsRoot   "cache"
$JdkRoot   = Join-Path $ToolsRoot   "jdk"
$MavenRoot = Join-Path $ToolsRoot   "maven"
$NodeRoot  = Join-Path $ToolsRoot   "node"
$PnpmRoot  = Join-Path $ToolsRoot   "pnpm"
$StoreDir  = Join-Path $ToolsRoot   "pnpm-store"

function Write-Section($t) { Write-Host ""; Write-Host ("== {0} ==" -f $t) -ForegroundColor Cyan }
function Write-Step($t)    { Write-Host ("  -> {0}" -f $t) -ForegroundColor DarkGray }
function Write-Ok($t)      { Write-Host ("  OK {0}" -f $t) -ForegroundColor Green }

function Ensure-Dir($path) {
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

function Download-File($url, $dest) {
    if ((Test-Path -LiteralPath $dest) -and -not $Force) {
        Write-Step "cached: $(Split-Path -Leaf $dest)"
        return
    }
    Write-Step "download: $url"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

function Expand-Zip($zip, $dst) {
    Ensure-Dir $dst
    Write-Step "extract: $(Split-Path -Leaf $zip) -> $dst"
    Expand-Archive -LiteralPath $zip -DestinationPath $dst -Force
}

function Get-SingleSubdir($parent) {
    $children = @(Get-ChildItem -LiteralPath $parent -Directory)
    if ($children.Count -ne 1) {
        throw "Beklenen tek alt klasor degil: $parent (bulundu: $($children.Count))"
    }
    return $children[0].FullName
}

function Cleanup-Older($parent, $keepName) {
    if (-not (Test-Path -LiteralPath $parent)) { return }
    foreach ($d in @(Get-ChildItem -LiteralPath $parent -Directory)) {
        if ($d.Name -ne $keepName) {
            Write-Step "cleanup older: $($d.FullName)"
            Remove-Item -Recurse -Force -LiteralPath $d.FullName -ErrorAction SilentlyContinue
        }
    }
}

function Install-Jdk {
    Write-Section "JDK $JdkVersion"
    $target = Join-Path $JdkRoot ("jdk-{0}" -f $JdkVersion)
    if ((Test-Path -LiteralPath $target) -and -not $Force) {
        Cleanup-Older $JdkRoot ("jdk-{0}" -f $JdkVersion)
        Write-Ok "JDK already installed: $target"
        return $target
    }
    if ($Force -and (Test-Path -LiteralPath $target)) {
        Remove-Item -Recurse -Force -LiteralPath $target
    }
    Ensure-Dir $JdkRoot

    $zip = Join-Path $CacheRoot "jdk-$JdkVersion.zip"
    Download-File $JdkUrl $zip

    $stage = Join-Path $env:TEMP ("osint-jdk-stage-" + [guid]::NewGuid().ToString("N"))
    try {
        Expand-Zip $zip $stage
        $extracted = Get-SingleSubdir $stage
        Move-Item -LiteralPath $extracted -Destination $target -Force
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -Recurse -Force -LiteralPath $stage }
    }
    Cleanup-Older $JdkRoot ("jdk-{0}" -f $JdkVersion)
    Write-Ok "JDK installed at $target"
    return $target
}

function Install-Maven {
    Write-Section "Apache Maven $MavenVersion"
    $target = Join-Path $MavenRoot ("apache-maven-{0}" -f $MavenVersion)
    if ((Test-Path -LiteralPath $target) -and -not $Force) {
        Cleanup-Older $MavenRoot ("apache-maven-{0}" -f $MavenVersion)
        Write-Ok "Maven already installed: $target"
        return $target
    }
    if ($Force -and (Test-Path -LiteralPath $target)) {
        Remove-Item -Recurse -Force -LiteralPath $target
    }
    Ensure-Dir $MavenRoot

    $zip = Join-Path $CacheRoot "maven-$MavenVersion.zip"
    Download-File $MavenUrl $zip

    $stage = Join-Path $env:TEMP ("osint-maven-stage-" + [guid]::NewGuid().ToString("N"))
    try {
        Expand-Zip $zip $stage
        $extracted = Get-SingleSubdir $stage
        Move-Item -LiteralPath $extracted -Destination $target -Force
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -Recurse -Force -LiteralPath $stage }
    }
    Cleanup-Older $MavenRoot ("apache-maven-{0}" -f $MavenVersion)
    Write-Ok "Maven installed at $target"
    return $target
}

function Install-Node {
    Write-Section "Node.js $NodeVersion"
    $target = Join-Path $NodeRoot ("node-v{0}-win-x64" -f $NodeVersion)
    if ((Test-Path -LiteralPath $target) -and -not $Force) {
        Cleanup-Older $NodeRoot ("node-v{0}-win-x64" -f $NodeVersion)
        Write-Ok "Node already installed: $target"
        return $target
    }
    if ($Force -and (Test-Path -LiteralPath $target)) {
        Remove-Item -Recurse -Force -LiteralPath $target
    }
    Ensure-Dir $NodeRoot

    $zip = Join-Path $CacheRoot "node-$NodeVersion.zip"
    Download-File $NodeUrl $zip

    $stage = Join-Path $env:TEMP ("osint-node-stage-" + [guid]::NewGuid().ToString("N"))
    try {
        Expand-Zip $zip $stage
        $extracted = Get-SingleSubdir $stage
        Move-Item -LiteralPath $extracted -Destination $target -Force
    } finally {
        if (Test-Path -LiteralPath $stage) { Remove-Item -Recurse -Force -LiteralPath $stage }
    }
    Cleanup-Older $NodeRoot ("node-v{0}-win-x64" -f $NodeVersion)
    Write-Ok "Node installed at $target"
    return $target
}

function Install-Pnpm {
    Write-Section "pnpm $PnpmVersion"
    $target = Join-Path $PnpmRoot ("pnpm-{0}.exe" -f $PnpmVersion)
    $alias  = Join-Path $PnpmRoot "pnpm.exe"
    if ((Test-Path -LiteralPath $target) -and -not $Force) {
        if (-not (Test-Path -LiteralPath $alias)) {
            Copy-Item -LiteralPath $target -Destination $alias -Force
        }
        Write-Ok "pnpm already installed: $target"
        return $PnpmRoot
    }
    Ensure-Dir $PnpmRoot
    Download-File $PnpmUrl $target
    Copy-Item -LiteralPath $target -Destination $alias -Force
    Write-Ok "pnpm installed at $target"
    return $PnpmRoot
}

# ---------------------------------------------------------------------------

Write-Host "osint-tools bootstrap" -ForegroundColor Cyan
Write-Host ("Tools root : {0}" -f $ToolsRoot)
Write-Host ("Force      : {0}" -f [bool]$Force)

Ensure-Dir $ToolsRoot
Ensure-Dir $CacheRoot
Ensure-Dir $StoreDir

$jdk   = Install-Jdk
$mvn   = Install-Maven
$node  = Install-Node
$pnpm  = Install-Pnpm

Write-Section "Verify"
$javaExe = Join-Path $jdk  "bin\java.exe"
$mvnExe  = Join-Path $mvn  "bin\mvn.cmd"
$nodeExe = Join-Path $node "node.exe"
$pnpmExe = Join-Path $pnpm "pnpm.exe"

foreach ($pair in @(
    @("java", $javaExe),
    @("mvn",  $mvnExe),
    @("node", $nodeExe),
    @("pnpm", $pnpmExe)
)) {
    $label = $pair[0]
    $path  = $pair[1]
    if (Test-Path -LiteralPath $path) {
        Write-Host ("  OK [{0}] {1}" -f $label, $path)
    } else {
        Write-Warning ("  MISSING [{0}] {1}" -f $label, $path)
    }
}

Write-Host ""
Write-Host "Bootstrap tamamlandi. Yeni shell'de toolchain'e baglanmak icin:" -ForegroundColor Green
Write-Host "    . `"$($PSScriptRoot)\env.ps1`"" -ForegroundColor Yellow
Write-Host ""
