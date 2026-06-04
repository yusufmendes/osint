# isr-tools

Project-local **toolchain bootstrap** for the ISR MVP family of repos.

This repo contains nothing but two PowerShell scripts. Running them downloads
JDK 21, Apache Maven 3.9.15, Node.js LTS, pnpm and Docker CLI 29.4.2 into a
sibling `.tools/` folder (gitignored). Every other ISR repo (`isr-mvp`, `isr-auth-modules`,
`isr-gis-modules`, `isr-video-modules`, `isr-intelligence-modules`,
`isr-search-modules`, `isr-core-modules`) dot-sources `env.ps1` from here so
all of them share the same isolated toolchain - the host PATH is never used.

## Layout

```
isr-tools/
├─ bootstrap.ps1       # one-shot installer (idempotent; -Force re-downloads)
├─ env.ps1             # activates the toolchain for the CURRENT shell only
└─ .tools/             # downloaded payload (gitignored)
   ├─ jdk-21/
   ├─ maven-3.9.15/
   ├─ node/            # bundles npm + corepack -> pnpm
   ├─ docker-cli-29.4.2/
   ├─ pnpm-store/      # pnpm/corepack shims + pnpm store
   └─ .m2/             # local Maven repository (no host ~/.m2 leakage)
```

## Workspace expectation

Every consumer repo lives **as a sibling** of `isr-tools/`:

```
<workspace-root>/
├─ isr-tools/                 (this repo)
├─ isr-mvp/                   (frontend shell + Maven aggregator)
├─ isr-auth-modules/          (Spring Boot auth backend)
├─ isr-core-modules/          (shared TS types/hooks)
├─ isr-gis-modules/
├─ isr-video-modules/
├─ isr-intelligence-modules/
└─ isr-search-modules/
```

The two PowerShell scripts use `$PSScriptRoot` to locate `.tools/`, so they
work regardless of which sibling repo's working directory you run them from.

## Quick start

```powershell
# 1) one-time download (only what's missing). Re-run with -Force to refresh.
pwsh -ExecutionPolicy Bypass -File .\isr-tools\bootstrap.ps1

# 2) activate for the current shell session (run from any sibling repo)
. ..\isr-tools\env.ps1

# 3) sanity-check
java -version
mvn -version
node --version
pnpm --version
docker --version
```

`env.ps1` only mutates the current PowerShell session - no system PATH or
`%USERPROFILE%\.m2` is touched.

For IntelliJ/WebStorm npm run configurations, point the Node interpreter to
`<workspace-root>\isr-tools\.tools\node\node.exe` and the package manager to
`<workspace-root>\isr-tools\.tools\pnpm-store\pnpm.CMD`.

## What gets installed

| Tool      | Version                   | Source                                         |
| --------- | ------------------------- | ---------------------------------------------- |
| JDK       | Eclipse Temurin 21 (LTS)  | adoptium.net                                   |
| Maven     | Apache Maven 3.9.15       | dlcdn.apache.org / archive.apache.org fallback |
| Node.js   | latest LTS (auto-resolved) | nodejs.org                                     |
| pnpm      | enabled via Node corepack | (no extra download)                            |
| Docker CLI | 29.4.2                    | download.docker.com static Windows binary      |

## Notes

* `bootstrap.ps1` is idempotent: it skips downloads if the target already has
  the expected executable. Pass `-Force` to re-download everything.
* All caches live under `.tools/` so deleting that folder fully resets the
  toolchain without affecting anything else on the machine.
* Docker CLI is client-only; it does not install or start a Docker daemon. It
  uses the normal Docker client settings such as `DOCKER_HOST`.
* If your host has a corporate npm proxy, the pinned `registry=` line in each
  consumer repo's `.npmrc` overrides it - pnpm will hit the public registry.
