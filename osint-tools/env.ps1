<#
.SYNOPSIS
  Binds the current PowerShell session to the osint-tools isolated toolchain.

.DESCRIPTION
  Sets JAVA_HOME, MAVEN_HOME, PNPM_HOME, and related variables, and prepends
  the corresponding bin directories to PATH. Even if the host has global
  Java/Maven/Node/pnpm, this session uses the isolated binaries.

  Usage:
      . .\osint-tools\env.ps1     # must be dot-sourced
#>

[CmdletBinding()]
param()

$ToolsRoot = Join-Path $PSScriptRoot ".tools"

if (-not (Test-Path -LiteralPath $ToolsRoot)) {
    Write-Error "Toolchain not found: $ToolsRoot. Run bootstrap.ps1 first."
    return
}

function Resolve-SingleChild($parent, $hint) {
    if (-not (Test-Path -LiteralPath $parent)) {
        Write-Error "$hint directory not found: $parent. Run bootstrap.ps1."
        return $null
    }
    $children = @(Get-ChildItem -LiteralPath $parent -Directory)
    if ($children.Count -eq 0) {
        Write-Error "No installation under $hint at: $parent"
        return $null
    }
    return $children[0].FullName
}

$jdkHome   = Resolve-SingleChild (Join-Path $ToolsRoot "jdk")   "JDK"
$mavenHome = Resolve-SingleChild (Join-Path $ToolsRoot "maven") "Maven"
$nodeHome  = Resolve-SingleChild (Join-Path $ToolsRoot "node")  "Node"
$pnpmHome  = Join-Path $ToolsRoot "pnpm"
$pnpmStore = Join-Path $ToolsRoot "pnpm-store"

if (-not $jdkHome -or -not $mavenHome -or -not $nodeHome) { return }

$env:JAVA_HOME  = $jdkHome
$env:M2_HOME    = $mavenHome
$env:MAVEN_HOME = $mavenHome
$env:NODE_HOME  = $nodeHome
$env:PNPM_HOME  = $pnpmHome
$env:COREPACK_HOME = Join-Path $ToolsRoot "corepack"

# pnpm content-addressable store — shared by all repos
$env:PNPM_STORE_PATH = $pnpmStore

# pnpm/npm home (global installs) — keep off host AppData
$env:NPM_CONFIG_PREFIX        = Join-Path $ToolsRoot "npm-prefix"
$env:NPM_CONFIG_CACHE         = Join-Path $ToolsRoot "npm-cache"
$env:NPM_CONFIG_USERCONFIG    = Join-Path $ToolsRoot "config\npmrc-user"
$env:PNPM_CONFIG_GLOBAL_DIR   = Join-Path $ToolsRoot "pnpm-global"
$env:PNPM_CONFIG_GLOBAL_BIN_DIR = Join-Path $ToolsRoot "pnpm-global-bin"
$env:PNPM_CONFIG_STATE_DIR    = Join-Path $ToolsRoot "pnpm-state"
$env:PNPM_CONFIG_CACHE_DIR    = Join-Path $ToolsRoot "pnpm-cache"

foreach ($d in @(
    $env:NPM_CONFIG_PREFIX,
    $env:NPM_CONFIG_CACHE,
    (Split-Path $env:NPM_CONFIG_USERCONFIG -Parent),
    $env:PNPM_CONFIG_GLOBAL_DIR,
    $env:PNPM_CONFIG_GLOBAL_BIN_DIR,
    $env:PNPM_CONFIG_STATE_DIR,
    $env:PNPM_CONFIG_CACHE_DIR,
    $env:COREPACK_HOME
)) {
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# PATH precedence: isolated binaries always override host installs
$prefix = @(
    (Join-Path $jdkHome   "bin"),
    (Join-Path $mavenHome "bin"),
    $nodeHome,
    $pnpmHome,
    $env:PNPM_CONFIG_GLOBAL_BIN_DIR
) -join [IO.Path]::PathSeparator

$env:PATH = "$prefix$([IO.Path]::PathSeparator)$($env:PATH)"

Write-Host "osint-tools environment active:" -ForegroundColor Green
Write-Host ("  JAVA_HOME  = {0}" -f $env:JAVA_HOME)
Write-Host ("  MAVEN_HOME = {0}" -f $env:MAVEN_HOME)
Write-Host ("  NODE_HOME  = {0}" -f $env:NODE_HOME)
Write-Host ("  PNPM_HOME  = {0}" -f $env:PNPM_HOME)
Write-Host ("  pnpm store = {0}" -f $env:PNPM_STORE_PATH)

function _Osint-CaptureCommand([string]$exe, [string]$arg) {
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName  = $exe
        $psi.Arguments = $arg
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError  = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow  = $true
        $p = [System.Diagnostics.Process]::Start($psi)
        $stdoutTask = $p.StandardOutput.ReadToEndAsync()
        $stderrTask = $p.StandardError.ReadToEndAsync()
        if (-not $p.WaitForExit(15000)) {
            try { $p.Kill() } catch { }
            return "TIMEOUT"
        }
        $stdoutTask.Wait()
        $stderrTask.Wait()
        $combined = ($stdoutTask.Result + $stderrTask.Result).Trim()
        return ($combined -split "`r?`n" | Where-Object { $_ -ne "" } | Select-Object -First 1)
    } catch {
        return "FAIL: $($_.Exception.Message)"
    }
}

$javaBin = Join-Path $jdkHome   "bin\java.exe"
$mvnBin  = Join-Path $mavenHome "bin\mvn.cmd"
$nodeBin = Join-Path $nodeHome  "node.exe"
$pnpmBin = Join-Path $pnpmHome  "pnpm.exe"

Write-Host ""
Write-Host "Version check (isolated binaries):" -ForegroundColor Cyan
Write-Host ("  java : {0}" -f (_Osint-CaptureCommand $javaBin "-version"))
Write-Host ("  node : {0}" -f (_Osint-CaptureCommand $nodeBin "-v"))
Write-Host ("  pnpm : {0}" -f (_Osint-CaptureCommand $pnpmBin "-v"))
Write-Host ("  mvn  : {0}" -f (_Osint-CaptureCommand $mvnBin  "-v"))
