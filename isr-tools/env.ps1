# env.ps1
# Activates the project-local toolchain for the CURRENT PowerShell session.
# Usage:    . .\env.ps1
#
# Sets JAVA_HOME / MAVEN_HOME / NODE_HOME / DOCKER_CLI_HOME and prepends their
# bin folders to PATH.
# Nothing is written to the user/system environment - effects vanish when the
# session ends.

$root  = $PSScriptRoot
$tools = Join-Path $root '.tools'

$jdkDir   = Join-Path $tools 'jdk-21'
$mavenDir = Join-Path $tools 'maven-3.9.15'
$nodeDir  = Join-Path $tools 'node'
$dockerCliDir = Join-Path $tools 'docker-cli-29.4.2'

if (-not (Test-Path (Join-Path $jdkDir 'bin\java.exe'))) { throw "JDK not found at $jdkDir. Run .\bootstrap.ps1 first." }
if (-not (Test-Path (Join-Path $mavenDir 'bin\mvn.cmd'))) { throw "Maven not found at $mavenDir. Run .\bootstrap.ps1 first." }
if (-not (Test-Path (Join-Path $nodeDir 'node.exe'))) { throw "Node not found at $nodeDir. Run .\bootstrap.ps1 first." }
if (-not (Test-Path (Join-Path $dockerCliDir 'docker.exe'))) { throw "Docker CLI not found at $dockerCliDir. Run .\bootstrap.ps1 first." }

$env:JAVA_HOME  = $jdkDir
$env:MAVEN_HOME = $mavenDir
$env:M2_HOME    = $mavenDir
$env:NODE_HOME  = $nodeDir
$env:DOCKER_CLI_HOME = $dockerCliDir
$env:PNPM_HOME  = Join-Path $root '.tools\pnpm-store'
New-Item -ItemType Directory -Force -Path $env:PNPM_HOME | Out-Null

if (-not (Test-Path (Join-Path $env:PNPM_HOME 'pnpm.CMD'))) { throw "pnpm shim not found at $env:PNPM_HOME. Run .\bootstrap.ps1 first." }

# Local Maven repository so we never touch ~/.m2 from the host
$env:MAVEN_USER_HOME = Join-Path $root '.tools\.m2'
New-Item -ItemType Directory -Force -Path $env:MAVEN_USER_HOME | Out-Null

# Prepend our tools to PATH for this session ONLY.
$env:PATH = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:NODE_HOME;$env:NODE_HOME\node_modules\corepack\dist;$env:PNPM_HOME;$env:DOCKER_CLI_HOME;$env:PATH"

Write-Host "Project toolchain active in this session:"
Write-Host "  JAVA_HOME  = $env:JAVA_HOME"
Write-Host "  MAVEN_HOME = $env:MAVEN_HOME"
Write-Host "  NODE_HOME  = $env:NODE_HOME"
Write-Host "  DOCKER_CLI_HOME = $env:DOCKER_CLI_HOME"
Write-Host "  java   -> $((Get-Command java).Source)"
Write-Host "  mvn    -> $((Get-Command mvn.cmd).Source)"
Write-Host "  node   -> $((Get-Command node).Source)"
Write-Host "  pnpm   -> $((Get-Command pnpm.cmd).Source)"
Write-Host "  docker -> $((Get-Command docker.exe).Source)"
