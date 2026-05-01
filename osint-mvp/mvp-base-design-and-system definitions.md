# Modern ISR Web — Initial Implementation (Intelligence, GIS, Video, Search)

This document defines how to set up the **initial skeleton** of the project: libraries to use, **shell + four domain web modules** (intelligence, gis, video, search), the shared `**osint-web-core`** library, multi-repo tooling (eight independent git repos linked at filesystem level via pnpm `file:` protocol; shared isolated toolchain in the `osint-tools/` repo), **MVP auth** (`osint-auth-backend` + JWT), a single RTK store + module slices, TanStack Query, and manifest-based routing.

---

## 1) Framework and Libraries to Use


| Layer              | Choice                      |
| ------------------ | --------------------------- |
| UI Framework       | **React**                   |
| UI Component Kit   | **MUI** (enterprise UI kit) |
| JS Type System     | **TypeScript**              |
| Dev/Build Tool     | **Vite**                    |
| Client State       | **Redux Toolkit (RTK)**     |
| Server State       | **TanStack Query**          |
| Router             | **TanStack Router**         |
| 3D GIS             | **CesiumJS** (main 3D globe) |
| Backend JDK        | **Java 21** (LTS)           |
| Backend Framework  | **Spring Boot 4.0.6**       |
| Backend Build Tool | **Apache Maven 3.9.15**     |


**Version rule**

- The **latest stable** versions of the libraries above will be installed so they work together without compatibility issues.
- Although GIS libraries are not yet used in the current empty (scaffold) implementation, **all GIS libraries will be added to `**osint-gis-web`**.
- **React, MUI, TypeScript, RTK, TanStack Query**, and **Vite** packages shared across every module will be added to `package.json` from the start.

---

## 2) Shell Application and Creating Modules

The project consists of **1 shell application**, **4 domain web modules**, and **1 shared** library package.

**Shell**

- `osint-mvp-web-shell` — shell application (layout, auth, routing, global RTK store, global QueryClient). It does not host domain capabilities; it imports modules and renders them. Folder: `osint-mvp/osint-mvp-web-shell/` (its own git repo).

**Domain modules**

- `osint-intelligence-web` — Intelligence module. Folder: `osint-intelligence-modules/`
- `osint-gis-web` — GIS module. Folder: `osint-gis-modules/`
- `osint-video-web` — Video module. Folder: `osint-video-modules/`
- `osint-search-web` — Search module. Folder: `osint-search-modules/`

**Shared library**

- `osint-web-core` — Shared types and helpers (`AppModule`, `RootState`, ...). Folder: `osint-core-modules/`

> Naming is kept symmetric with the backend `osint-<domain>-backend` pattern (`osint-gis-web` ↔ `osint-gis-backend`).
> **Folder / repo rule**: Each `osint-*-modules/` top folder is an **independent git repo** and hosts **one** package (e.g. `osint-gis-modules/osint-gis-web/`); the shell also lives as the `osint-mvp-web-shell/` package under the `osint-mvp/` repo; shared libraries sit under `osint-core-modules/<package>/`. The `-modules` plural is deliberately kept for flexibility to host additional packages under the same area later (e.g. `osint-gis-modules/osint-gis-map-kit/` or `osint-core-modules/osint-backend-core/`).

**Rules**

- The shell contains no domain capability; it only loads modules, processes their manifests, and provides shared infrastructure (store, query client, router, theme).
- Each module **dynamically** defines **its own menus and routes** via a **manifest**.
- Each module contains a `**config.ts**` file. That file:
  - manages the module’s own **internal behavior settings**,
  - and **access information** such as **external / remote server / service URLs**
  in one place.
- Shared types (e.g. `AppModule`, `RootState`) live in the `**osint-web-core`** package; the shell and all modules import from there.

---

## 3) Module Manifest Examples

> The examples below show each module exporting an `AppModule`-typed manifest from its own `src/index.ts`. The main app scans these manifests and builds the menu and routes **dynamically**.

### 3.1. `osint-gis-modules/osint-gis-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

// Each page goes to its own chunk
const MapPage    = lazy(() => import('./pages/MapPage'));
const LayersPage = lazy(() => import('./pages/LayersPage'));

export const gisModule: AppModule = {
  id: 'gis',
  title: 'GIS',
  permissions: ['gis.map.view', 'gis.layers.view'],
  menu: [
    { path: '/gis/map',    label: 'Map',    permissions: ['gis.map.view'] },
    { path: '/gis/layers', label: 'Layers', permissions: ['gis.layers.view'] },
  ],
  routes: [
    { path: '/gis/map',    element: <MapPage />,    permissions: ['gis.map.view'] },
    { path: '/gis/layers', element: <LayersPage />, permissions: ['gis.layers.view'] },
  ],
};
```

### 3.2. `osint-intelligence-modules/osint-intelligence-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const IntelligenceCrudPage = lazy(() => import('./pages/IntelligenceCrudPage'));

export const intelligenceModule: AppModule = {
  id: 'intelligence',
  title: 'Intelligence',
  permissions: ['intelligence.crud.view'],
  menu: [
    { path: '/intelligence/crud', label: 'Create Intelligence',   permissions: ['intelligence.crud.view'] },
  ],
  routes: [
    { path: '/intelligence/crud', element: <IntelligenceCrudPage />, permissions: ['intelligence.crud.view'] },
  ],
};
```

### 3.3. `osint-video-modules/osint-video-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));

export const videoModule: AppModule = {
  id: 'video',
  title: 'Video',
  permissions: ['video.player.view'],
  menu: [
    { path: '/video/player', label: 'Video Player', permissions: ['video.player.view'] },
  ],
  routes: [
    { path: '/video/player', element: <VideoPlayer />, permissions: ['video.player.view'] },
  ],
};
```

### 3.4. `osint-search-modules/osint-search-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const SearchPage = lazy(() => import('./pages/SearchPage'));

export const searchModule: AppModule = {
  id: 'search',
  title: 'Search',
  permissions: ['search.panel.view'],
  menu: [
    { path: '/search/panel', label: 'Search', permissions: ['search.panel.view'] },
  ],
  routes: [
    { path: '/search/panel', element: <SearchPage />, permissions: ['search.panel.view'] },
  ],
};
```

---

## 4) RTK Store — Single Store, Module Slices

**Architecture**

- The shell sets up **one global RTK store** (`configureStore`).
- **Slice ownership is in the module**: each web module exports its own slice (`gisSlice`, `videoSlice`, `intelligenceSlice`, `searchSlice`) and reducer.
- The shell combines reducers from modules to build the store. The shell also has a small `shellSlice` (layout, active menu, etc.).
- Single store → single DevTools, single middleware chain, single `RootState` type, consistent time-travel/persist.

**Dummy field demo (proof the setup works)**

- Each slice starts with a `dummy: string` field: `shell-hello`, `gis-hello`, `video-hello`, `intel-hello`, `search-hello`.
- When a page in each module renders, it reads **all five dummies** with `useSelector` and concatenates:
`Hello {shell} + {gis} + {video} + {intel} + {search}`
- This demo proves:
  - The single store is wired correctly.
  - Modules can read each other’s state via selectors.
  - Later, modules can add their own business slices using the same pattern.

**Example: module slice** (`osint-gis-modules/osint-gis-web/src/store/gisSlice.ts`)

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const gisSlice = createSlice({
  name: 'gis',
  initialState: { dummy: 'gis-hello' },
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
  },
});

export const { setDummy } = gisSlice.actions;
export const gisReducer = gisSlice.reducer;
```

**Example: shell store** (`osint-mvp/osint-mvp-web-shell/src/store/index.ts`)

```ts
import { configureStore } from '@reduxjs/toolkit';
import { gisReducer } from 'osint-gis-web';
import { videoReducer } from 'osint-video-web';
import { intelligenceReducer } from 'osint-intelligence-web';
import { searchReducer } from 'osint-search-web';
import { shellReducer } from './shellSlice';

export const store = configureStore({
  reducer: {
    shell: shellReducer,
    gis: gisReducer,
    video: videoReducer,
    intelligence: intelligenceReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Example: cross-module read** (`osint-gis-modules/osint-gis-web/src/pages/MapPage.tsx`)

```tsx
import { useSelector } from 'react-redux';
import type { RootState } from 'osint-web-core';

export default function MapPage() {
  const shell  = useSelector((s: RootState) => s.shell.dummy);
  const gis    = useSelector((s: RootState) => s.gis.dummy);
  const video  = useSelector((s: RootState) => s.video.dummy);
  const intel  = useSelector((s: RootState) => s.intelligence.dummy);
  const search = useSelector((s: RootState) => s.search.dummy);

  return <h1>Hello {shell} + {gis} + {video} + {intel} + {search}</h1>;
}
```

> **Note (type sharing)**: So `RootState` does not create circular dependencies for modules, the type is declared in `osint-web-core`; the shell augments it to match the reducer schema. Alternative: RTK 2.0 `combineSlices` + `injectSlices` for **lazy slice registration** (modules inject into the store at runtime; the shell does not need to know them all up front).

---

## 5) TanStack Server State

**Goal**: Manage the Intelligence entity’s server state with TanStack Query; share the cache across **all modules** (GIS, Video, Intelligence, Search).

**Entity** (`osint-intelligence-modules/osint-intelligence-web/src/domain/intelligence.ts`)

- Fields: `id`, `header`, `description`, `templateId`, `createdAt`, `tags[]`, ...

**API** (`osint-intelligence-modules/osint-intelligence-web/src/api/intelligenceApi.ts`)

- Base URL is read from the module `config.ts` (e.g. Solr endpoint).
- Functions:
  - `getById(id)`
  - `executeQuery(q)` — Solr query DSL
  - `deleteById(id)`
  - `create(dto)`
  - `update(dto)`

**Cache strategy (TanStack Query)**

- A single **`QueryClient`** is set up in the shell; `QueryClientProvider` wraps the whole app → cache sharing is automatic.
- QueryKey schema (central factory for consistency):
  - `['intelligence', 'byId', id]`
  - `['intelligence', 'query', queryHash]`
- `staleTime`, `gcTime` values are read from the module `config.ts` (can be tuned per env).
- After mutations (`create`, `update`, `deleteById`), related query keys are refreshed with `queryClient.invalidateQueries(...)`.

**Cross-module access**

- `osint-intelligence-web` exports consumable **shared hooks**:
  - `useIntelligenceById(id)`
  - `useIntelligenceQuery(q)`
  - `useDeleteIntelligence()`
- GIS, Video, and Search modules import and use these hooks; they do not call the API directly.
- Because the same `QueryClient` is shared, all four modules consume the same cache (a `getById(42)` query in one module is an instant cache hit in another).

**Use TanStack capabilities as much as practical**

- `useQuery`, `useMutation`, `useInfiniteQuery` (pagination), `useSuspenseQuery` (optional).
- `queryClient.prefetchQuery` — preload data on module transitions.
- `select` — derive view-specific data in the component (avoids unnecessary re-renders).
- DevTools: `@tanstack/react-query-devtools` mounted once in the shell.

---

## 6) Multi-Repo Topology and Tooling

**Packaging model**: Eight independent git repos are checked out as **siblings** under the same `<workspace-root>/`. There is no single `pnpm-workspace.yaml` or Turborepo; inter-module dependencies are linked at filesystem level via pnpm `file:` protocol.

```
<workspace-root>/                 (e.g. D:\IsrMvp\)
├─ osint-tools/                     # shared toolchain repo (bootstrap.ps1 + env.ps1 + .tools/)
├─ osint-mvp/                       # frontend shell + thin Maven aggregator (pom.xml)
│  └─ osint-mvp-web-shell/          # Vite app
├─ osint-core-modules/              # osint-web-core (bottom-most base)
├─ osint-intelligence-modules/      # osint-intelligence-web (shared data domain)
├─ osint-gis-modules/               # osint-gis-web (CesiumJS)
├─ osint-video-modules/             # osint-video-web
├─ osint-search-modules/            # osint-search-web
└─ osint-auth-modules/              # osint-auth-backend (Spring Boot, self-contained POM)
```

**Frontend dependency declaration**: each consumer references siblings via `file:` paths. Example (`osint-mvp/osint-mvp-web-shell/package.json`):

```json
{
  "dependencies": {
    "osint-web-core":         "file:../../osint-core-modules/osint-web-core",
    "osint-intelligence-web": "file:../../osint-intelligence-modules/osint-intelligence-web",
    "osint-gis-web":          "file:../../osint-gis-modules/osint-gis-web",
    "osint-video-web":        "file:../../osint-video-modules/osint-video-web",
    "osint-search-web":       "file:../../osint-search-modules/osint-search-web"
  }
}
```

pnpm `file:` deps link `node_modules/<pkg>` to the target folder as a symlink; therefore **modules are still consumed from source** (no build). Vite transforms TypeScript source directly through the symlink.

`**bootstrap:siblings` helper** (`osint-mvp-web-shell/scripts/install-siblings.mjs`): pnpm `file:` deps only link the sibling **folder** — the sibling’s own `node_modules/` is not populated automatically. This script runs `pnpm install --prefer-offline` in each sibling repo in dependency order (`core` → `intelligence` → `gis/video/search`) to prepare the graph with one command:

```powershell
cd osint-mvp\osint-mvp-web-shell
pnpm bootstrap:siblings   # pnpm install for each sibling
pnpm install              # shell deps + relative symlink siblings
```

**Toolchain repo `osint-tools`**: all repos dot-source `<workspace-root>/osint-tools/env.ps1` to attach to an isolated JDK 21 / Maven 3.9.15 / Node LTS / pnpm 10 toolchain. `.tools/` content (~250 MB) is excluded via `osint-tools/.gitignore`; because the bootstrap script is `$PSScriptRoot`-based, it does not matter which sibling repo you dot-source from.

**Per-repo configuration files** (in each frontend repo):

- `tsconfig.json` — self-contained (no shared parent). The shell additionally has `tsconfig.base.json` but it is only consumed via shell `extends`.
- `.eslintrc.cjs` — **per-repo boundary guard** with `no-restricted-imports` (see Section 7).
- `.npmrc` — `registry=https://registry.npmjs.org/` (enterprise proxy override), `node-linker=isolated`, `link-workspace-packages=false`, `store-dir=../../osint-tools/.tools/pnpm-store` (shared content-addressable store).
- `.prettierrc` — shell only; modules follow the shell formatting rules.
- `.gitignore` — at repo root; `node_modules/`, `dist/`, `target/`, IDE state.

**Backend**: `osint-auth-modules/osint-auth-backend/pom.xml` is **self-contained** — no `<parent>`; `spring-boot-dependencies` BOM is imported directly in `<dependencyManagement>`. `osint-mvp/pom.xml` is only a **thin aggregator** with `<modules><module>../osint-auth-modules/osint-auth-backend</module></modules>`; as long as the sibling repo is checked out, `mvn` runs workspace-wide; if not, the backend module can still be built standalone with its own POM.

**Production bundle**: individual module builds do not exist. `pnpm build` runs in the shell repo; Vite tree-shakes all sibling modules and produces a single bundle under `osint-mvp-web-shell/dist/`.

**Trade-offs and deliberate choices**:

- Advantage: each repo versions/releases independently; CI stays single-package based; no Turborepo-style monorepo orchestrator responsibility.
- Cost: on dependency changes consumers run `pnpm bootstrap:siblings` then `pnpm install`. The shared store avoids network traffic.

---

## 7) Dependency Graph and Developer Experience

**Dependency rule (multi-tier)**

```
osint-mvp-web-shell                                 ← may import everything
        │
        ▼
osint-gis-web   osint-video-web   osint-search-web      ← visualization siblings
        │           │               │                (horizontal siblings forbidden)
        └────┐      │      ┌────────┘
             ▼      ▼      ▼
            osint-intelligence-web                   ← shared data domain
                       │
                       ▼
                  osint-web-core                     ← bottom-most base
```

- `**osint-web-core**` imports no `osint-*-web` module; framework-agnostic types, hooks (`useCurrentUser`), shared base for Zod schemas.
- `**osint-intelligence-web**` is a shared data domain: it may depend on `osint-web-core` but must not import visualization siblings (gis/video/search). It exports `useIntelligenceById`, `useIntelligenceQuery`, `useDeleteIntelligence`.
- **Visualization siblings** (`osint-gis-web`, `osint-video-web`, `osint-search-web`) may import `osint-web-core` and `osint-intelligence-web`, but not each other.
- **Shell** may import everything.

**Multi-repo boundary enforcement**: there is no single `eslint-plugin-boundaries` config — each repo declares its boundary guard in its own `.eslintrc.cjs` with `no-restricted-imports`. Example (`osint-gis-modules/osint-gis-web/.eslintrc.cjs`):

```js
'no-restricted-imports': ['error', { patterns: [{
  group: ['osint-video-web', 'osint-search-web'],
  message: 'Visualization domain modules MUST NOT import sibling visualization modules.',
}]}]
```

`osint-intelligence-web`’s ESLint only forbids `gis/video/search`; `osint-web-core`’s ESLint forbids all `osint-*-web` packages. Thus no central boundaries plugin is required and each repo can be linted independently.

`**RootState` type sharing (cross-repo, no circular deps)**

`osint-core-modules/osint-web-core/src/store.ts`:

```ts
export interface AppRootStateSchema {} // initially empty — shell augments

export type RootState = AppRootStateSchema;
```

Each module exports its own state type:

```ts
// osint-gis-modules/osint-gis-web/src/store/gisSlice.ts
export type GisState = { dummy: string /* ... */ };
```

The shell augments all types from one place:

```ts
// osint-mvp/osint-mvp-web-shell/src/store/augmentations.ts
import 'osint-web-core';
import type { ShellState } from './shellSlice';
import type { GisState } from 'osint-gis-web';
import type { VideoState } from 'osint-video-web';
import type { IntelligenceState } from 'osint-intelligence-web';
import type { SearchState } from 'osint-search-web';

declare module 'osint-web-core' {
  interface AppRootStateSchema {
    shell: ShellState;
    gis: GisState;
    video: VideoState;
    intelligence: IntelligenceState;
    search: SearchState;
  }
}
```

Result: `RootState` works **fully type-safe** (autocomplete, refactor-safe) across all repos.

`**osint-web-core` package dependencies**

Because `useCurrentUser` uses `useSelector`, `osint-web-core` declares the following as `**peerDependencies**` (it does not add them to its own `dependencies` — avoids duplicate React / Redux instance risk):

```json
{
  "peerDependencies": {
    "react": "^19.0.0 || ^18.3.0",
    "react-dom": "^19.0.0 || ^18.3.0",
    "react-redux": "^9.0.0"
  }
}
```

- Each consumer (shell + 4 visualization domains + intelligence) carries these packages in its own `dependencies`; pnpm’s shared store resolves to a single instance.
- Version ranges are aligned across each sibling repo to match the shell `package.json` major/minor.

**Dev server and Hot Module Replacement (HMR) — multi-repo**

The dev loop **does not** include a manual build step:

1. `pnpm dev` in the shell repo (`osint-mvp/osint-mvp-web-shell/`) starts the Vite dev server.
2. The shell uses package names like `import { gisModule } from 'osint-gis-web'`.
3. pnpm linked `node_modules/osint-gis-web` as a symlink to `../../osint-gis-modules/osint-gis-web/`; the real source files live in another repo.
4. Vite follows `"main": "./src/index.tsx"` in the module’s `package.json` and reads TypeScript source directly.
5. When a developer saves `osint-gis-modules/osint-gis-web/src/pages/MapPage.tsx`:
  - Vite’s file watcher picks up the change through the symlink.
  - Vite logs `[vite] (client) hmr update /@fs/<workspace>/osint-gis-modules/osint-gis-web/src/pages/MapPage.tsx`.
  - **The browser refreshes in ~100–300 ms while keeping state.**

This behavior was validated end to end: a change in `osint-gis-web` flowed into the shell’s HMR cleanly (Vite 7.3.2, `vite.log` output). Cross-repo source consumption + HMR works after moving to multi-repo.

**Vite config requirements** (`osint-mvp/osint-mvp-web-shell/vite.config.ts`):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ['..', '../..'] }, // allow up to workspace root (cross-repo source serve)
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Notes:

- `server.fs.allow: ['..', '../..']` from shell `osint-mvp/osint-mvp-web-shell/` goes two levels up to the workspace root; required to serve source from sibling repos.
- In Vite 7, listing sibling packages in `optimizeDeps.include` is **unnecessary**: pnpm symlinks and `"main": "./src/index.tsx"` already pull source into Vite’s module graph; adding them triggers `Cannot optimize dependency` warnings.

**Production build**: `pnpm build` in the shell repo. Vite tree-shakes sibling modules into one bundle. Sibling modules have **no** separate build.

---

## 8) Auth and Permissions (MVP: simple backend + dummy users)

**MVP approach**

The MVP does **not** set up Keycloak/OIDC. Instead a **simple Spring Boot service** (`osint-auth-backend`) runs; users and permissions are **hardcoded dummy** data in `application.yml`. The shell logs in to this service and receives JWT. Keycloak/Azure AD integration is planned in **Section 12 Roadmap** — MVP’s `ProtectedRoute` + `useCurrentUser()` abstractions mean that switch does not break modules (only the auth source changes).

### 8.1. Backend: `osint-auth-backend`

- **Location**: `osint-auth-modules/osint-auth-backend/`
- **Stack**: Java 21, Spring Boot 3, Spring Security (JWT), Spring Web.
- **No persistence (MVP)**: user list is read from `application.yml`; DB comes later.

`**application.yml` (example)**

```yaml
server:
  port: 8081

osint:
  auth:
    jwtSecret: dev-only-change-me-in-prod
    jwtTtlMinutes: 60
    users:
      - username: admin
        password: admin123
        permissions:
          - gis.map.view
          - gis.layers.view
          - video.player.view
          - intelligence.crud.view
          - search.panel.view
      - username: viewer
        password: viewer123
        permissions:
          - gis.map.view
          - video.player.view
          - search.panel.view
```

**Endpoints**

- `POST /auth/login`
  - Request: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "accessToken": "<JWT>", "expiresIn": 3600 }`
- `GET /me`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `{ "userId": "u-1", "username": "admin", "permissions": ["gis.map.view", ...] }`
- `POST /auth/logout`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `204` (MVP: client-side discard is enough; blacklist later)

**JWT payload**

```json
{
  "sub": "u-1",
  "username": "admin",
  "permissions": ["gis.map.view", "intelligence.crud.view"],
  "exp": 1735689600
}
```

> Embedding `permissions` in the JWT is pragmatic for MVP. If permission count grows large (50+), keep the JWT minimal and fetch via `/me`.

### 8.2. Shell integration

**Folder**: `osint-mvp/osint-mvp-web-shell/src/auth/`

- `LoginPage.tsx` — simple MUI form (username + password + submit).
- `authApi.ts` — `login(username, password)`, `fetchMe()`, `logout()`; base URL from shell `config.ts`.
- `authInterceptor.ts` — fetch/axios interceptor:
  - Adds `Authorization: Bearer <JWT>` to every request.
  - On `401`, clears JWT and redirects to `/login`.
- `ProtectedRoute.tsx` — route guard component (below).

`**useCurrentUser()` hook** (exported from `osint-web-core`)

```ts
// osint-core-modules/osint-web-core/src/auth/useCurrentUser.ts
import { useSelector } from 'react-redux';
import type { RootState } from '../store.d';

export interface CurrentUser {
  id: string;
  username: string;
  permissions: string[];
}

export function useCurrentUser() {
  const state = useSelector((s: RootState) => s.shell);
  return {
    user: state.user as CurrentUser | null,
    isAuthenticated: state.authStatus === 'authenticated',
    hasPermission: (p: string) => !!state.user?.permissions.includes(p),
  };
}
```

### 8.3. `shellSlice` structure

```ts
// osint-mvp/osint-mvp-web-shell/src/store/shellSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ShellState {
  dummy: string;
  user: { id: string; username: string; permissions: string[] } | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
}

const initialState: ShellState = {
  dummy: 'shell-hello',
  user: null,
  authStatus: 'idle',
  token: null,
};

export const shellSlice = createSlice({
  name: 'shell',
  initialState,
  reducers: {
    authLoading: (s) => { s.authStatus = 'loading'; },
    authSuccess: (s, a: PayloadAction<{ token: string; user: ShellState['user'] }>) => {
      s.authStatus = 'authenticated';
      s.token = a.payload.token;
      s.user = a.payload.user;
    },
    authFail: (s) => {
      s.authStatus = 'unauthenticated';
      s.token = null;
      s.user = null;
    },
    logout: (s) => {
      s.authStatus = 'unauthenticated';
      s.token = null;
      s.user = null;
    },
  },
});

export const shellActions = shellSlice.actions;
export const shellReducer = shellSlice.reducer;
```

### 8.4. `ProtectedRoute` component

**Important**: The `Navigate` below comes from **`@tanstack/react-router`** — do not confuse with `react-router-dom`. TanStack Router recommends this component for redirect-on-mount (`useEffect` + `useNavigate` instead).

```tsx
// osint-mvp/osint-mvp-web-shell/src/auth/ProtectedRoute.tsx
import { Navigate } from '@tanstack/react-router';
import { useCurrentUser } from 'osint-web-core';
import { ForbiddenPage } from './ForbiddenPage'; // in-shell stub / real 403 page

interface Props {
  permissions: string[];
  children: React.ReactNode;
}

export function ProtectedRoute({ permissions, children }: Props) {
  const { isAuthenticated, hasPermission } = useCurrentUser();

  // replace: true → login redirect does not bloat history (no back-button loop)
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const missing = permissions.filter((p) => !hasPermission(p));
  if (missing.length > 0) return <ForbiddenPage missing={missing} />;

  return <>{children}</>;
}
```

> Later you can use `throw redirect({ to: '/login' })` in route `beforeLoad`; for MVP this wrapper is enough and applies one pattern to all manifest routes.

The menu layout (`RootLayout`) also filters via `hasPermission` — users without permission **do not see** the menu item.

### 8.5. Login flow (end-to-end)

```
1. User opens shell first (no JWT) → redirected to /login.
2. LoginPage form submit → POST /auth/login (osint-auth-backend).
3. Backend validates dummy user, issues JWT and returns it.
4. Shell:
     - Stores JWT in localStorage.
     - Dispatches shellSlice.authSuccess (token + user + permissions).
5. Router sends user to the first matching manifest route.
6. Each route render runs <ProtectedRoute permissions=[...]> check.
7. Every API request: authInterceptor adds JWT.
8. On page refresh: shell boot reads JWT from localStorage → GET /me → shellSlice.authSuccess.
9. On JWT expiry (401) → interceptor logout dispatch + /login redirect.
```

### 8.6. JWT storage (MVP → Production)

- **MVP**: `localStorage` + Redux memory. Pragmatic for dev; vulnerable to XSS.
- **Production (Keycloak migration)**: `httpOnly` cookie + refresh token rotation. Backend sets the cookie; frontend JS cannot read it.

### 8.7. Rule — modules

- **No domain module** (`osint-gis-web`, `osint-video-web`, ...) **stores** auth state.
- Use `useCurrentUser().hasPermission(...)` for permission checks.
- Never pass the token into modules as a parameter — `authInterceptor` adds it automatically for all API calls.

### 8.8. Skipped in MVP, to add later

- Rate limiting / brute-force protection (Bucket4j vs.).
- Password hashing (MVP uses plaintext comparison; out of scope for Keycloak migration discussion).
- CSRF protection (enabled when moving to Keycloak + cookies).
- Multi-tenant / compartment.
- Permission inheritance / role hierarchy.
- Audit log.

All of these are in **Section 12 Roadmap**; MVP’s `useCurrentUser` + `ProtectedRoute` abstractions keep that migration non-breaking.

---

## 9) Cross-module Interaction Rules

**Allowed**

- **Read another module’s state**: `useSelector((s: RootState) => s.gis.selectedLayer)`.
- **Use another module’s exported hook**: `useIntelligenceById(id)`.
- Use shared types / utilities in `osint-web-core`.

**Forbidden**

- **Dispatch another module’s slice actions from outside** (e.g. `dispatch(gisActions.setLayer(...))` from the Video module). A module mutates its own slice only inside its boundaries.
- **Import one module from another module’s source** (horizontal import). Shared need → `osint-web-core`.
- Shared mutable singleton outside `osint-web-core`.

**If a write is needed**

- The module exposes an **action hook** in its exports: `export function useGisActions() { ... }`. The consumer calls it; implementation stays under the module’s control (consumers do not break if the slice shape changes).
- For fully decoupled communication, a global event bus (`mitt`) can live in the shell. **Not default; last resort**.

---

## 10) Manifest → TanStack Router Bridge

The shell collects module manifests and translates them for TanStack Router:

```ts
// osint-mvp/osint-mvp-web-shell/src/router/index.ts
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { gisModule } from 'osint-gis-web';
import { intelligenceModule } from 'osint-intelligence-web';
import { videoModule } from 'osint-video-web';
import { searchModule } from 'osint-search-web';
import { RootLayout } from '../layout/RootLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';

const rootRoute = createRootRoute({ component: RootLayout });

export const allModules = [gisModule, intelligenceModule, videoModule, searchModule];

const moduleRoutes = allModules.flatMap((m) =>
  m.routes.map((r) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: r.path,
      component: () => (
        <ProtectedRoute permissions={r.permissions}>{r.element}</ProtectedRoute>
      ),
    }),
  ),
);

export const router = createRouter({
  routeTree: rootRoute.addChildren(moduleRoutes),
});
```

The same `allModules` array is used for **menu rendering** (layout sidebar flattens `m.menu` and runs permission filter).

---

## 11) Testing Strategy

**In-module (each package `__tests__/` or `*.test.ts`)**

- **Vitest** + `@testing-library/react`.
- **Slice tests**: pure reducer input/output.
- **Hook tests**: `renderHook` + mock `QueryClient`.
- **Component tests**: wrap with required `Provider`s (store + queryClient).

**Shell integration test**

- One test in `osint-mvp-web-shell` wires manifest → store → router end to end and checks:
  - Are all module reducers registered in the store?
  - Does the cross-module dummy demo (`Hello shell + gis + video + intel + search`) render correctly?

**E2E**

- **Playwright** opens the shell against the dev server.
- Smoke test: login → navigate to one page per module → no console errors.

**CI**

- In multi-repo, CI runs **per repo**: each repo runs its own `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm lint` (and for the shell `pnpm build`). Which repos are affected is derived from downstream `file:` references in `package.json` (e.g. a break in `osint-web-core` triggers pipelines for five consumer repos).

---

## 12) Later (Roadmap — outside MVP scope)

These notes point to **growth directions** for the architecture; they are not implemented in MVP:

- **Keycloak / OIDC integration**: `osint-auth-backend` delegates to Keycloak (authorize → token exchange → `/me` mapping). Shell moves to Authorization Code + PKCE with `oidc-client-ts`. JWT storage becomes `httpOnly` cookie + refresh token rotation. `useCurrentUser` and `ProtectedRoute` abstractions stay the same → **module code does not change**. This migration is handled together with user persistence (DB), password hashing, MFA, audit log, rate limiting, and other production requirements.
- **Shared UI kit**: `osint-core-modules/osint-web-ui/` for theme + base components (Button, DataTable, FormField, DialogShell...) in one package. All modules consume MUI through this kit. Recommended for visual/UX consistency in 3–6 months.
- **Search infrastructure split**: When a second searchable entity is added, `osint-search-web` will export a generic `useSearch(index, query)` hook; all entity modules including Intelligence will use it in their APIs (today `executeQuery` lives on the Intelligence API).
- **Lazy slice registration**: If module count goes past 10+, migrate to RTK 2.0 `combineSlices` + `injectSlices`. The shell only knows `shellSlice` at startup; each module injects its slice when loaded.
- **Module Federation**: If modules need separate deploy cycles (independent release), consider Vite Module Federation. Not needed for MVP.

---

## 13) Implementation Checklist (verifies the skeleton is fully set up)

When **all** items below are green, the MVP skeleton is complete:

- 8 git repos sit as siblings at workspace root: `osint-tools/`, `osint-mvp/`, `osint-core-modules/`, `osint-intelligence-modules/`, `osint-gis-modules/`, `osint-video-modules/`, `osint-search-modules/`, `osint-auth-modules/`. `osint-tools/` owns the isolated toolchain (JDK 21 + Maven 3.9.15 + Node LTS + pnpm); each sibling dot-sources `..\osint-tools\env.ps1`.
- In the shell repo (`osint-mvp/osint-mvp-web-shell/`) you have `package.json`, `tsconfig.json` (+ `tsconfig.base.json`), `vite.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.npmrc`, and `scripts/install-siblings.mjs` (`pnpm bootstrap:siblings` command).
- In every frontend repo (5 modules + shell): **per-repo** `.eslintrc.cjs` (`no-restricted-imports`), `.npmrc` (registry pin + `node-linker=isolated` + shared `store-dir=../../osint-tools/.tools/pnpm-store`), `.gitignore`, and self-contained `tsconfig.json`.
- Inter-module dependencies are declared in `package.json` as `file:../../osint-*-modules/...` (or `file:../../osint-core-modules/...`); after sibling repos are checked out each consumer is set up with `pnpm bootstrap:siblings` + `pnpm install`.
- `osint-web-core/package.json`: `peerDependencies` lists `react`, `react-dom`, `react-redux` (ranges aligned with shell); core does not add them to its own `dependencies`.
- 6 frontend packages exist: `osint-mvp-web-shell`, `osint-gis-web`, `osint-video-web`, `osint-intelligence-web`, `osint-search-web`, `osint-web-core`.
- 1 backend service exists: `osint-auth-backend` (Spring Boot, dummy users).
- Each package has `package.json`, `tsconfig.json`, `src/index.ts` (frontend); auth-backend has `pom.xml` / `build.gradle` + `application.yml`.
- Each domain module exports its `AppModule` manifest.
- Each domain module has `config.ts` and required libraries (for GIS, **CesiumJS**) listed in `package.json`.
- Each module has a slice with a `dummy` field; `RootState` in `osint-web-core` is augmented in the shell.
- Shell `configureStore` combines all module reducers; app wrapped with `<Provider>`.
- Shell mounts `QueryClient` + `QueryClientProvider`; DevTools visible in dev.
- Shell builds TanStack Router dynamically from manifests; `<ProtectedRoute>` wraps every route.
- `osint-auth-backend` is up (`:8081`); `POST /auth/login`, `GET /me`, `POST /auth/logout` work.
- Shell has `LoginPage` + `authApi` + `authInterceptor` + `useCurrentUser`; JWT resume from localStorage works.
- Login as `admin/admin123` → access all modules; login as `viewer/viewer123` → only permitted modules show in menu; others get `ForbiddenPage`.
- Each module’s page renders **all five dummies** concatenated as `Hello {shell} + {gis} + {video} + {intel} + {search}`.
- Intelligence entity + API + 3 TanStack hooks (`useIntelligenceById`, `useIntelligenceQuery`, `useDeleteIntelligence`) export from `osint-intelligence-web`; GIS/Video/Search use the hook on a page.
- Vitest “manifest integration test” is green.
- `pnpm dev` opens the shell; login → navigation to one page per module works.
- HMR proof: edit `osint-gis-web/src/pages/MapPage.tsx` → browser refreshes with state preserved without a manual build.
