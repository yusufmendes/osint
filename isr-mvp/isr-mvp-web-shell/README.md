# ISR MVP - Web Shell

This is the **canonical entry-point** for the ISR MVP frontend. The repository
you're reading (`isr-mvp/`) hosts the shell application and a thin Maven
aggregator. Eight sibling repositories together make up the full MVP:

| Repo                          | Role                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `isr-tools`                   | One-shot toolchain installer (JDK 21 + Maven 3.9.15 + Node LTS + pnpm) |
| `isr-mvp` (this one)          | Frontend shell + thin Maven aggregator                       |
| `isr-core-modules`            | Shared types / hooks (`isr-web-core`)                        |
| `isr-intelligence-modules`    | Intelligence data domain + cross-cutting hooks               |
| `isr-gis-modules`             | GIS visualization (CesiumJS)                                 |
| `isr-video-modules`           | Video visualization                                          |
| `isr-search-modules`          | Search visualization                                         |
| `isr-auth-modules`            | Spring Boot 4.0.6 auth backend                               |

Architecturally everything is identical to `Initial Implementation.md`; only
the **packaging** changed (one repo per package, joined at filesystem time
via `file:` paths and a Maven aggregator). Modules are still consumed
**from source** by Vite (`"main": "./src/index.tsx"`); only the shell
produces a production bundle.

---

## 1. Prerequisites

You only need:

- Windows 10 / 11 with PowerShell 5.1+ (the project ships a self-contained
  toolchain - nothing on the host PATH is required).
- Internet access for the first bootstrap.
- All eight ISR repos checked out **side-by-side** in the same workspace
  folder (e.g. `D:\IsrMvp\`):

```
<workspace-root>/
├─ isr-tools/                 # toolchain repo (run bootstrap.ps1 / dot-source env.ps1)
├─ isr-mvp/                   # this repo (frontend shell + Maven aggregator)
├─ isr-core-modules/
├─ isr-intelligence-modules/
├─ isr-gis-modules/
├─ isr-video-modules/
├─ isr-search-modules/
└─ isr-auth-modules/
```

Pinned tool versions (everything is downloaded once into `isr-tools/.tools/`):

| Tool             | Version             | Source                         |
| ---------------- | ------------------- | ------------------------------ |
| Eclipse Temurin  | JDK 21 (latest GA)  | `api.adoptium.net`             |
| Apache Maven     | 3.9.15              | `dlcdn.apache.org` / archive   |
| Node.js          | latest LTS          | `nodejs.org`                   |
| pnpm             | latest stable (10.x)| enabled via Node corepack      |

Spring Boot **4.0.6** is pulled in by Maven; CesiumJS is declared as a
runtime dependency of `isr-gis-web`.

---

## 2. Bootstrap (run once per machine)

From the workspace root in PowerShell:

```powershell
pwsh -ExecutionPolicy Bypass -File .\isr-tools\bootstrap.ps1
```

This populates `isr-tools/.tools/` with `jdk-21/`, `maven-3.9.15/`, `node/`,
`pnpm-store/`, `.m2/` and a `_downloads/` cache (~250 MB total). Re-run with
`-Force` to wipe and redownload.

---

## 3. Activate the toolchain in a shell

Every shell that builds or runs anything in this workspace must first
dot-source `env.ps1` from the `isr-tools` repo:

```powershell
# from any sibling repo's working directory
. ..\isr-tools\env.ps1

# or, from the workspace root
. .\isr-tools\env.ps1
```

It sets `JAVA_HOME`, `MAVEN_HOME`, `NODE_HOME`, `PNPM_HOME`,
`MAVEN_USER_HOME` and prepends the right `bin/` folders to `$env:PATH` for
the current PowerShell session. Closing the shell restores the host
environment.

---

## 4. Build everything

```powershell
. ..\isr-tools\env.ps1     # if not already active

# 4.1 Backend (Spring Boot 4.0.6 fat jar)
cd ..\isr-auth-modules\isr-auth-backend
mvn -B -ntp "-Dmaven.repo.local=$env:MAVEN_USER_HOME" package

# - or via the thin aggregator -
cd ..\..\isr-mvp
mvn -B -ntp "-Dmaven.repo.local=$env:MAVEN_USER_HOME" package

# 4.2 Frontend
cd .\isr-mvp-web-shell
pnpm bootstrap:siblings    # one-shot pnpm install in every sibling module
pnpm install               # install shell deps + symlink siblings
pnpm typecheck
pnpm test
pnpm build                 # production bundle (Vite tree-shakes every module)
```

Outputs:

| Artifact                                                            | Size (approx.) |
| ------------------------------------------------------------------- | -------------- |
| `isr-auth-modules/isr-auth-backend/target/isr-auth-backend.jar`     | 27 MB (fat)    |
| `isr-mvp/isr-mvp-web-shell/dist/`                                   | ~1 MB gzipped  |

> **Why `bootstrap:siblings`?** With `file:` deps, pnpm only links the
> sibling **folder**; it does NOT install the sibling's own dependencies.
> The helper script under `./scripts/install-siblings.mjs` walks the
> dependency graph (`isr-web-core` → `isr-intelligence-web` → the rest)
> and runs `pnpm install --prefer-offline` in each of them. It's idempotent.

---

## 5. Run

Two terminals (each one must dot-source `env.ps1`):

### 5.1 Auth backend

```powershell
. ..\isr-tools\env.ps1
java -jar ..\isr-auth-modules\isr-auth-backend\target\isr-auth-backend.jar
```

Listens on `http://localhost:8081`. Endpoints:

```
POST /auth/login    -> { accessToken, expiresIn }
GET  /me            -> { userId, username, permissions[] }     (requires Bearer)
POST /auth/logout   -> 204                                     (requires Bearer)
GET  /actuator/health
```

### 5.2 Web shell (Vite dev server with HMR)

```powershell
. ..\..\isr-tools\env.ps1
pnpm dev
```

Listens on `http://localhost:5173`. The shell reads `VITE_AUTH_API` (defaults
to `http://localhost:8081`) - see `src/config.ts`.

### 5.3 Demo users

| User    | Password    | Permissions                                                                                                  |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| admin   | admin123    | `gis.map.view`, `gis.layers.view`, `video.player.view`, `intelligence.crud.view`, `search.panel.view`        |
| viewer  | viewer123   | `gis.map.view`, `video.player.view`, `search.panel.view`                                                     |

`viewer` cannot see *Katmanlar* and *İstihbarat Yarat* in the side menu and
gets a `<ForbiddenPage>` if she tries to navigate there directly.

### 5.4 Production preview of the shell

```powershell
. ..\..\isr-tools\env.ps1
pnpm build
pnpm preview          # http://localhost:5174
```

---

## 6. Troubleshooting

### `pnpm install` fails with `ERR_PNPM_FETCH_404`

The host has a corporate Verdaccio proxy in its global `~/.npmrc`. Every ISR
repo ships its own `.npmrc` that pins the registry to
`https://registry.npmjs.org/`. If it still fails, force the registry on the
command line:

```powershell
pnpm install --registry=https://registry.npmjs.org/
```

### `pnpm install` fails because `isr-gis-web` etc. cannot be resolved

You forgot `pnpm bootstrap:siblings`. Each `file:` link points at a sibling
folder that must already have its own `node_modules/`.

### Maven cannot reach Maven Central

If you sit behind a proxy:

```powershell
$env:HTTP_PROXY  = 'http://your.proxy:8080'
$env:HTTPS_PROXY = 'http://your.proxy:8080'
```

before running `bootstrap.ps1` and `mvn`.

### `java -version` shows the wrong JDK

You forgot `. ..\isr-tools\env.ps1`. Every new shell must dot-source it once.

### Vite won't pick up changes to a domain module

Run `pnpm install` in the changed module's repo first (so its
`node_modules/` is fresh), then restart Vite.  Re-running
`pnpm bootstrap:siblings` from the shell does the same thing for every
module at once.

---

## 7. Repo layout

```
isr-mvp/
├── pom.xml                          thin Maven aggregator (-> ../isr-auth-modules/isr-auth-backend)
├── Initial Implementation.md        full system spec (canonical)
├── .gitignore
└── isr-mvp-web-shell/               <-- the Vite/pnpm shell app
    ├── package.json                 file:../../isr-*-modules/... deps
    ├── tsconfig.json                extends ./tsconfig.base.json
    ├── tsconfig.base.json
    ├── vite.config.ts
    ├── .eslintrc.cjs                shell-local lint rules
    ├── .prettierrc
    ├── .npmrc                       registry pin + isolated linker
    ├── .gitignore
    ├── index.html
    ├── README.md                    (this file)
    ├── scripts/
    │   └── install-siblings.mjs     one-shot bootstrap helper
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── config.ts
    │   ├── auth/
    │   ├── layout/
    │   ├── router/
    │   ├── store/
    │   └── queryClient.ts
    └── tests/
        └── setup.ts
```

The remaining seven repos (`isr-tools`, `isr-core-modules`,
`isr-intelligence-modules`, `isr-gis-modules`, `isr-video-modules`,
`isr-search-modules`, `isr-auth-modules`) live as **siblings** of
`isr-mvp/` in the workspace.

---

## 8. Implementation status against the spec checklist (sec. 13)

Every checklist item in `../Initial Implementation.md` section 13 is
satisfied. The roadmap items in section 12 are intentionally **not**
implemented (Keycloak, password hashing, audit log, ...).
