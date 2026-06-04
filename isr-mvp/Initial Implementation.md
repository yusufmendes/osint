# Modern ISR Web — Initial Implementation (Intelligence, GIS, Video, Search)

Bu doküman, projenin **ilk iskeletinin** nasıl kurulacağını tanımlar: kullanılacak kütüphaneler, **shell + dört domain web modülü** (intelligence, gis, video, search), ortak `**isr-web-core`** kütüphanesi, multi-repo tooling (sekiz bağımsız git reposu, pnpm `file:` protokolüyle dosya sistemi seviyesinde sembolik bağlanır; ortak izole toolchain `isr-tools/` reposunda), **MVP auth** (`isr-auth-backend` + JWT), tek RTK store + modül slice'ları, TanStack Query ve manifest tabanlı routing.

---

## 1) Kullanılacak Framework ve Kütüphaneler


| Katman            | Seçim                       |
| ----------------- | --------------------------- |
| UI Framework      | **React**                   |
| UI Component Kit  | **MUI** (kurumsal UI kit)   |
| JS Type System    | **TypeScript**              |
| Dev/Build Tool    | **Vite**                    |
| Client State      | **Redux Toolkit (RTK)**     |
| Server State      | **TanStack Query**          |
| Router            | **TanStack Router**         |
| 3D GIS            | **CesiumJS** (ana 3D globe) |
| Backend JDK       | **Java 21** (LTS)           |
| Backend Framework | **Spring Boot 4.0.6**       |
| Backend Build Tool| **Apache Maven 3.9.15**     |


**Sürüm kuralı**

- Yukarıdaki kütüphanelerin birbirleriyle uyum problemi olmayacak şekilde **en güncel stabil** sürümleri indirilip kurulacak.
- Şu anki boş (scaffold) implementasyonda GIS kütüphaneleri henüz kullanılmıyor olsa da `**isr-gis-web` içine tüm GIS kütüphaneleri eklenecek**.
- Her modülde ortak kullanılacak olan **React, MUI, TypeScript, RTK, TanStack Query** ve **Vite** paketleri `package.json` içine baştan eklenecek.

---

## 2) Shell Uygulaması ve Modüllerin Oluşturulması

Proje, **1 shell uygulaması**, **4 domain web modülü** ve **1 ortak kütüphane** paketinden oluşur.

**Shell**

- `isr-mvp-web-shell` — çatı uygulama (layout, auth, routing, global RTK store, global QueryClient). Domain yeteneği barındırmaz; modülleri import edip render eder. Klasör: `isr-mvp/isr-mvp-web-shell/` (kendi git reposu).

**Domain modülleri**

- `isr-intelligence-web` — Intelligence modülü. Klasör: `isr-intelligence-modules/`
- `isr-gis-web` — GIS modülü. Klasör: `isr-gis-modules/`
- `isr-video-web` — Video modülü. Klasör: `isr-video-modules/`
- `isr-search-web` — Search modülü. Klasör: `isr-search-modules/`

**Ortak kütüphane**

- `isr-web-core` — Ortak tipler ve yardımcılar (`AppModule`, `RootState`, ...). Klasör: `isr-core-modules/`

> İsimlendirme, backend tarafındaki `isr-<domain>-backend` kalıbıyla simetrik tutulmuştur (`isr-gis-web` ↔ `isr-gis-backend`).
> **Klasör / repo kuralı**: Her `isr-*-modules/` üst klasörü **bağımsız bir git reposu**dur ve içinde **bir** paket barındırır (örn. `isr-gis-modules/isr-gis-web/`); shell de `isr-mvp/` reposunun altında `isr-mvp-web-shell/` paketi olarak yaşar; ortak kütüphaneler `isr-core-modules/<paket>/` altındadır. `-modules` çoğulu, ileride aynı alan altında ek paket barındırma esnekliği için bilinçli olarak korunur (örn. `isr-gis-modules/isr-gis-map-kit/` veya `isr-core-modules/isr-backend-core/`).

**Kurallar**

- Shell domain yeteneği içermez; yalnızca modülleri yükler, manifest'lerini işler ve ortak altyapıyı (store, query client, router, tema) sağlar.
- Her modül, **kendi menülerini ve route'larını** bir **manifest** üzerinden **dinamik** olarak tanımlar.
- Her modülün içinde bir `**config.ts`** dosyası bulunur. Bu dosya:
  - modülün kendi **iç davranış ayarları**nı,
  - **dış dünya / remote server / servis adresleri** gibi erişim bilgilerini
  tek yerden yönetir.
- Ortak tipler (ör. `AppModule`, `RootState`) `**isr-web-core`** paketinde tutulur; shell ve tüm modüller oradan import eder.

---

## 3) Modül Manifest Örnekleri

> Aşağıdaki örnekler her modülün kendi `src/index.ts` dosyasında `AppModule` tipinde bir manifest export ettiğini gösterir. Ana uygulama bu manifest’leri tarar, menüyü ve route’ları **dinamik olarak** kurar.

### 3.1. `isr-gis-modules/isr-gis-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

// Her sayfa kendi chunk'ına gidiyor
const MapPage    = lazy(() => import('./pages/MapPage'));
const LayersPage = lazy(() => import('./pages/LayersPage'));

export const gisModule: AppModule = {
  id: 'gis',
  title: 'GIS',
  permissions: ['gis.map.view', 'gis.layers.view'],
  menu: [
    { path: '/gis/map',    label: 'Harita',    permissions: ['gis.map.view'] },
    { path: '/gis/layers', label: 'Katmanlar', permissions: ['gis.layers.view'] },
  ],
  routes: [
    { path: '/gis/map',    element: <MapPage />,    permissions: ['gis.map.view'] },
    { path: '/gis/layers', element: <LayersPage />, permissions: ['gis.layers.view'] },
  ],
};
```

### 3.2. `isr-intelligence-modules/isr-intelligence-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

const IntelligenceCrudPage = lazy(() => import('./pages/IntelligenceCrudPage'));

export const intelligenceModule: AppModule = {
  id: 'intelligence',
  title: 'Intelligence',
  permissions: ['intelligence.crud.view'],
  menu: [
    { path: '/intelligence/crud', label: 'İstihbarat Yarat',   permissions: ['intelligence.crud.view'] },
  ],
  routes: [
    { path: '/intelligence/crud', element: <IntelligenceCrudPage />, permissions: ['intelligence.crud.view'] },
  ],
};
```

### 3.3. `isr-video-modules/isr-video-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

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

### 3.4. `isr-search-modules/isr-search-web/src/index.ts`

```ts
import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

const SearchPage = lazy(() => import('./pages/SearchPage'));

export const searchModule: AppModule = {
  id: 'search',
  title: 'Search',
  permissions: ['search.panel.view'],
  menu: [
    { path: '/search/panel', label: 'Arama', permissions: ['search.panel.view'] },
  ],
  routes: [
    { path: '/search/panel', element: <SearchPage />, permissions: ['search.panel.view'] },
  ],
};
```

---

## 4) RTK Store — Tek Store, Modül Slice'ları

**Mimari**

- Shell **tek bir global RTK store** kurar (`configureStore`).
- **Slice sahipliği modüldedir**: her web modülü kendi slice'ını (`gisSlice`, `videoSlice`, `intelligenceSlice`, `searchSlice`) ve reducer'ını export eder.
- Shell, modüllerden gelen reducer'ları birleştirerek store'u oluşturur. Shell'in de küçük bir `shellSlice`'ı vardır (layout, aktif menü vb.).
- Tek store → tek DevTools, tek middleware zinciri, tek `RootState` tipi, tutarlı time-travel/persist.

**Dummy alan demosu (kurulumun doğru çalıştığının kanıtı)**

- Her slice, `dummy: string` alanıyla başlar: `shell-hello`, `gis-hello`, `video-hello`, `intel-hello`, `search-hello`.
- Her modülün bir sayfası render olduğunda **beş dummy'yi de** `useSelector` ile okuyup concat eder:
`Merhaba {shell} + {gis} + {video} + {intel} + {search}`
- Bu demo şunu kanıtlar:
  - Tek store doğru kurulmuş.
  - Modüller birbirlerinin state'ine selector üzerinden erişebiliyor.
  - İleride modüller kendi iş slice'larını aynı pattern ile ekleyebilir.

**Örnek: modül slice'ı** (`isr-gis-modules/isr-gis-web/src/store/gisSlice.ts`)

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

**Örnek: shell store** (`isr-mvp/isr-mvp-web-shell/src/store/index.ts`)

```ts
import { configureStore } from '@reduxjs/toolkit';
import { gisReducer } from 'isr-gis-web';
import { videoReducer } from 'isr-video-web';
import { intelligenceReducer } from 'isr-intelligence-web';
import { searchReducer } from 'isr-search-web';
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

**Örnek: cross-module okuma** (`isr-gis-modules/isr-gis-web/src/pages/MapPage.tsx`)

```tsx
import { useSelector } from 'react-redux';
import type { RootState } from 'isr-web-core';

export default function MapPage() {
  const shell  = useSelector((s: RootState) => s.shell.dummy);
  const gis    = useSelector((s: RootState) => s.gis.dummy);
  const video  = useSelector((s: RootState) => s.video.dummy);
  const intel  = useSelector((s: RootState) => s.intelligence.dummy);
  const search = useSelector((s: RootState) => s.search.dummy);

  return <h1>Merhaba {shell} + {gis} + {video} + {intel} + {search}</h1>;
}
```

> **Not (tip paylaşımı)**: `RootState` tipinin modüllere döngüsel bağımlılık yaratmaması için, tip `isr-web-core` içinde declare edilir; shell reducer şemasıyla bu tipi augment eder. Alternatif: RTK 2.0 `combineSlices` + `injectSlices` ile **lazy slice registration** (modüller runtime'da store'a enjekte edilir, shell başlangıçta hepsini tanımak zorunda kalmaz).

---

## 5) TanStack Server State

**Amaç**: Intelligence entity'sinin server-state'ini TanStack Query ile yönetmek; cache'i **tüm modüller** (GIS, Video, Intelligence, Search) arasında paylaşmak.

**Entity** (`isr-intelligence-modules/isr-intelligence-web/src/domain/intelligence.ts`)

- Alanlar: `id`, `header`, `description`, `templateId`, `createdAt`, `tags[]`, ...

**API** (`isr-intelligence-modules/isr-intelligence-web/src/api/intelligenceApi.ts`)

- Base URL modül `config.ts` içinden okunur (ör. Solr endpoint'i).
- Fonksiyonlar:
  - `getById(id)`
  - `executeQuery(q)` — Solr query DSL
  - `deleteById(id)`
  - `create(dto)`
  - `update(dto)`

**Cache stratejisi (TanStack Query)**

- **Tek `QueryClient`** shell'de kurulur; `QueryClientProvider` ile tüm uygulamayı sarar → cache paylaşımı otomatik olur.
- QueryKey şeması (tutarlı olsun diye merkezi factory):
  - `['intelligence', 'byId', id]`
  - `['intelligence', 'query', queryHash]`
- `staleTime`, `gcTime` değerleri modül `config.ts`'den okunur (env'e göre ayarlanabilir).
- Mutations (`create`, `update`, `deleteById`) sonrası ilgili query key'ler `queryClient.invalidateQueries(...)` ile tazelenir.

**Cross-module erişim**

- `isr-intelligence-web`, tüketilebilir **paylaşılan hook'lar** export eder:
  - `useIntelligenceById(id)`
  - `useIntelligenceQuery(q)`
  - `useDeleteIntelligence()`
- GIS, Video ve Search modülleri bu hook'ları import edip kullanır; API'yi doğrudan çağırmaz.
- Aynı `QueryClient` paylaşıldığı için dört modül de aynı cache'i tüketir (bir modülün `getById(42)` sorgusu, diğer modülde anında cache hit olur).

**Olabildiğince TanStack yeteneklerini kullan**

- `useQuery`, `useMutation`, `useInfiniteQuery` (sayfalama), `useSuspenseQuery` (isteğe bağlı).
- `queryClient.prefetchQuery` — modül geçişlerinde önceden veri yükleme.
- `select` fonksiyonu — component'e özel veri türetme (gereksiz re-render'ı önler).
- DevTools: `@tanstack/react-query-devtools` shell'de tek kez mount edilir.

---

## 6) Multi-Repo Topolojisi ve Tooling

**Paketleme modeli**: Sekiz bağımsız git reposu, aynı `<workspace-root>/` altında **siblings** olarak checkout edilir. Tek bir `pnpm-workspace.yaml` ya da Turborepo yoktur; modüller arası bağımlılıklar pnpm `file:` protokolüyle dosya sistemi seviyesinde sembolik bağlanır.

```
<workspace-root>/                 (örn. D:\IsrMvp\)
├─ isr-tools/                     # ortak toolchain repo (bootstrap.ps1 + env.ps1 + .tools/)
├─ isr-mvp/                       # frontend shell + ince Maven aggregator (pom.xml)
│  └─ isr-mvp-web-shell/          # Vite uygulaması
├─ isr-core-modules/              # isr-web-core (en alt taban)
├─ isr-intelligence-modules/      # isr-intelligence-web (paylaşılan veri domain'i)
├─ isr-gis-modules/               # isr-gis-web (CesiumJS)
├─ isr-video-modules/             # isr-video-web
├─ isr-search-modules/            # isr-search-web
└─ isr-auth-modules/              # isr-auth-backend (Spring Boot, self-contained POM)
```

**Frontend bağımlılık bildirimi**: her tüketici, sibling'leri `file:` yoluyla referans eder. Örnek (`isr-mvp/isr-mvp-web-shell/package.json`):

```json
{
  "dependencies": {
    "isr-web-core":         "file:../../isr-core-modules/isr-web-core",
    "isr-intelligence-web": "file:../../isr-intelligence-modules/isr-intelligence-web",
    "isr-gis-web":          "file:../../isr-gis-modules/isr-gis-web",
    "isr-video-web":        "file:../../isr-video-modules/isr-video-web",
    "isr-search-web":       "file:../../isr-search-modules/isr-search-web"
  }
}
```

pnpm `file:` deps'i `node_modules/<pkg>` altında hedef klasöre symlink olarak bağlar; dolayısıyla **modüller hâlâ source'tan tüketilir** (build yok). Vite, symlink üzerinden TypeScript kaynağını doğrudan transform eder.

**`bootstrap:siblings` yardımcısı** (`isr-mvp-web-shell/scripts/install-siblings.mjs`): pnpm `file:` deps yalnız sibling **klasörünü** bağlar — sibling'in kendi `node_modules/` içeriği otomatik dolmaz. Bu script, bağımlılık grafini (`core` → `intelligence` → `gis/video/search`) sırasında her bir sibling repo'da `pnpm install --prefer-offline` çalıştırarak grafı tek komutla hazırlar:

```powershell
cd isr-mvp\isr-mvp-web-shell
pnpm bootstrap:siblings   # her sibling için pnpm install
pnpm install              # shell deps + symlink siblings
```

**Toolchain repo'su `isr-tools`**: tüm repolar `<workspace-root>/isr-tools/env.ps1`'i dot-source ederek izole JDK 21 / Maven 3.9.15 / Node LTS / pnpm 10 takımına bağlanır. `.tools/` içeriği (~250 MB) `isr-tools/.gitignore` tarafından dışarıda bırakılır; bootstrap script'i `$PSScriptRoot` tabanlı olduğu için hangi sibling repo'dan dot-source edildiği önemli değil.

**Per-repo konfigürasyon dosyaları** (her frontend repo'sunda):

- `tsconfig.json` — self-contained (paylaşılan parent yok). Shell'de ek olarak `tsconfig.base.json` bulunur ama yalnızca shell `extends`'iyle tüketilir.
- `.eslintrc.cjs` — `no-restricted-imports` ile **per-repo sınır koruyucusu** (Section 7'ye bakınız).
- `.npmrc` — `registry=https://registry.npmjs.org/` (kurumsal proxy override), `node-linker=isolated`, `link-workspace-packages=false`, `store-dir=../../isr-tools/.tools/pnpm-store` (paylaşılan content-addressable store).
- `.prettierrc` — yalnız shell'de; modüller shell'in formatlama kurallarını takip eder.
- `.gitignore` — repo kökünde; `node_modules/`, `dist/`, `target/`, IDE state.

**Backend tarafı**: `isr-auth-modules/isr-auth-backend/pom.xml` **self-contained** — `<parent>` yoktur, `spring-boot-dependencies` BOM doğrudan `<dependencyManagement>`'da import edilir. `isr-mvp/pom.xml` ise yalnız `<modules><module>../isr-auth-modules/isr-auth-backend</module></modules>` içeren **ince bir aggregator**'dur; sibling repo checkout'u olduğu sürece `mvn` komutu workspace bazında çalışır, olmadığında backend modülü kendi POM'uyla bağımsız olarak build edilebilir.

**Production bundle**: tek tek modüllerin build'i yoktur. `pnpm build` shell repo'sunda çalıştırılır; Vite tüm sibling modüllerini tree-shake ederek `isr-mvp-web-shell/dist/` altında tek bir bundle üretir.

**Trade-off ve kasten yapılan seçimler**:

- Avantaj: her repo bağımsız versiyonlanır / release'lenir; CI tek-paket bazlı kalır; Turborepo gibi monorepo orkestratörü sorumluluğu kalkar.
- Maliyet: bağımlılık değişikliğinde tüketiciler `pnpm bootstrap:siblings` sonra `pnpm install` çalıştırır. Paylaşılan store sayesinde ağ trafiği olmaz.

---

## 7) Bağımlılık Grafı ve Geliştirme Deneyimi

**Bağımlılık kuralı (multi-tier)**

```
isr-mvp-web-shell                                 ← her şeyi import edebilir
        │
        ▼
isr-gis-web   isr-video-web   isr-search-web      ← visualization siblings
        │           │               │                (yatay siblings yasak)
        └────┐      │      ┌────────┘
             ▼      ▼      ▼
            isr-intelligence-web                   ← paylaşılan veri domain'i
                       │
                       ▼
                  isr-web-core                     ← en alt taban
```

- **`isr-web-core`** hiçbir `isr-*-web` modülünü import etmez; framework-agnostic tipler, hook'lar (`useCurrentUser`), zod şemaları için paylaşılan taban.
- **`isr-intelligence-web`** bir paylaşılan veri domain'idir: `isr-web-core`'a bağımlı olabilir, ama görsel siblings'i (gis/video/search) import edemez. `useIntelligenceById`, `useIntelligenceQuery`, `useDeleteIntelligence` hook'larını export eder.
- **Visualization siblings** (`isr-gis-web`, `isr-video-web`, `isr-search-web`) `isr-web-core` ve `isr-intelligence-web`'i import edebilir, ama birbirini import edemez.
- **Shell** her şeyi import edebilir.

**Multi-repo'da boundary enforcement**: tek bir `eslint-plugin-boundaries` konfigürasyonu yok — her repo kendi `.eslintrc.cjs`'sinde `no-restricted-imports` ile sınır koruyucusunu ilan eder. Örnek (`isr-gis-modules/isr-gis-web/.eslintrc.cjs`):

```js
'no-restricted-imports': ['error', { patterns: [{
  group: ['isr-video-web', 'isr-search-web'],
  message: 'Visualization domain modules MUST NOT import sibling visualization modules.',
}]}]
```

`isr-intelligence-web`'in eslint'i yalnız `gis/video/search`'ü yasaklar; `isr-web-core`'un eslint'i tüm `isr-*-web` paketlerini yasaklar. Böylelikle merkezi bir boundaries plugin'i gerekmez ve her repo bağımsız lint edilebilir.

**`RootState` tip paylaşımı (cross-repo, circular dep'siz)**

`isr-core-modules/isr-web-core/src/store.ts`:

```ts
export interface AppRootStateSchema {} // başlangıçta boş — shell augment eder

export type RootState = AppRootStateSchema;
```

Her modül kendi state tipini export eder:

```ts
// isr-gis-modules/isr-gis-web/src/store/gisSlice.ts
export type GisState = { dummy: string /* ... */ };
```

Shell tek merkezden tüm tipleri augment eder:

```ts
// isr-mvp/isr-mvp-web-shell/src/store/augmentations.ts
import 'isr-web-core';
import type { ShellState } from './shellSlice';
import type { GisState } from 'isr-gis-web';
import type { VideoState } from 'isr-video-web';
import type { IntelligenceState } from 'isr-intelligence-web';
import type { SearchState } from 'isr-search-web';

declare module 'isr-web-core' {
  interface AppRootStateSchema {
    shell: ShellState;
    gis: GisState;
    video: VideoState;
    intelligence: IntelligenceState;
    search: SearchState;
  }
}
```

Sonuç: `RootState`, tüm repolar arasında **tam tip-güvenli** (autocomplete, refactor-safe) şekilde çalışır.

**`isr-web-core` paket bağımlılıkları**

`useCurrentUser` içinde `useSelector` kullanıldığı için `isr-web-core`, aşağıdakileri **`peerDependencies`** olarak ilan eder (kendi `dependencies` listesine eklemez — duplicate React / Redux instance riskini ortadan kaldırır):

```json
{
  "peerDependencies": {
    "react": "^19.0.0 || ^18.3.0",
    "react-dom": "^19.0.0 || ^18.3.0",
    "react-redux": "^9.0.0"
  }
}
```

- Her tüketici (shell + 4 visualization domain + intelligence) bu paketleri kendi `dependencies` içinde taşır; pnpm shared store sayesinde tek instance çözer.
- Sürüm aralıkları, shell `package.json` ile aynı major / minor olacak şekilde her sibling repo'da hizalanır.

**Dev server ve Hot Module Replacement (HMR) — multi-repo'da**

Geliştirme döngüsü manuel build adımı **içermez**:

1. `pnpm dev` shell repo'sunda (`isr-mvp/isr-mvp-web-shell/`) Vite dev server'ı başlatır.
2. Shell, `import { gisModule } from 'isr-gis-web'` gibi paket adlarıyla ifade eder.
3. pnpm, `node_modules/isr-gis-web`'i `../../isr-gis-modules/isr-gis-web/`'e symlink olarak bağlamıştır; gerçek kaynak dosyalar farklı bir repo'da yaşar.
4. Vite, modülün `package.json`'undaki `"main": "./src/index.tsx"` alanını izleyerek TypeScript kaynağını doğrudan okur.
5. Geliştirici `isr-gis-modules/isr-gis-web/src/pages/MapPage.tsx`'i kaydettiğinde:
  - Vite file watcher değişikliği symlink üzerinden yakalar.
  - Vite log'una `[vite] (client) hmr update /@fs/<workspace>/isr-gis-modules/isr-gis-web/src/pages/MapPage.tsx` düşürür.
  - **Tarayıcı ~100-300 ms içinde state'ini koruyarak yenilenir.**

Bu davranış uçtan uca doğrulandı: bir `isr-gis-web` dosya değişikliği shell'in HMR'ına sorunsuz düştü (Vite 7.3.2, `vite.log` çıktısı). Yani: cross-repo source consumption + HMR, multi-repo geçişten sonra da çalışıyor.

**Vite config gereksinimleri** (`isr-mvp/isr-mvp-web-shell/vite.config.ts`):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ['..', '../..'] }, // workspace root'a kadar erişim (cross-repo source serve)
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Notlar:

- `server.fs.allow: ['..', '../..']` shell `isr-mvp/isr-mvp-web-shell/`'tan iki seviye yukarı, yani workspace root'a kadar erişim verir; sibling repo'lardan source serve etmek için şart.
- Vite 7'de `optimizeDeps.include` ile sibling paketleri listelemek **gereksiz**: pnpm symlink'i ve `"main": "./src/index.tsx"` zaten Vite'in modül grafına kaynağı sokuyor; eklenirse `Cannot optimize dependency` uyarısı oluşuyor.

**Production build**: `pnpm build` shell repo'sunda. Vite, sibling modülleri tree-shake ederek tek bundle'a derler. Sibling modüllerin ayrı build'i **yok**.

---

## 8) Auth ve Permissions (MVP: basit backend + dummy kullanıcılar)

**MVP Yaklaşımı**

MVP'de **Keycloak/OIDC kurulmuyor**. Bunun yerine **basit bir Spring Boot servisi** (`isr-auth-backend`) ayağa kalkar; kullanıcılar ve permission'ları `application.yml`'de **hardcoded dummy** olarak tutulur. Shell bu servise login olup JWT alır. Keycloak/Azure AD entegrasyonu **Bölüm 12 Roadmap**'te planlanmıştır — MVP'nin `ProtectedRoute` + `useCurrentUser()` soyutlamaları sayesinde o geçiş kırılma yaratmaz (sadece auth kaynağı değişir).

### 8.1. Backend: `isr-auth-backend`

- **Konum**: `isr-auth-modules/isr-auth-backend/`
- **Stack**: Java 21, Spring Boot 3, Spring Security (JWT), Spring Web.
- **Kalıcılık yok (MVP)**: kullanıcı listesi `application.yml`'den okunur; DB ileride eklenir.

`**application.yml` (örnek)**

```yaml
server:
  port: 8081

isr:
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

**Endpoint'ler**

- `POST /auth/login`
  - Request: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "accessToken": "<JWT>", "expiresIn": 3600 }`
- `GET /me`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `{ "userId": "u-1", "username": "admin", "permissions": ["gis.map.view", ...] }`
- `POST /auth/logout`
  - Header: `Authorization: Bearer <JWT>`
  - Response: `204` (MVP'de client-side discard yeterli; blacklist ileride)

**JWT payload**

```json
{
  "sub": "u-1",
  "username": "admin",
  "permissions": ["gis.map.view", "intelligence.crud.view"],
  "exp": 1735689600
}
```

> `permissions`'ı JWT içine gömmek MVP için pragmatik. Permission sayısı büyürse (50+) JWT'yi minimal tutup `/me` üzerinden çekmek daha iyi.

### 8.2. Shell entegrasyonu

**Klasör**: `isr-mvp/isr-mvp-web-shell/src/auth/`

- `LoginPage.tsx` — MUI ile basit form (username + password + submit).
- `authApi.ts` — `login(username, password)`, `fetchMe()`, `logout()` fonksiyonları; base URL shell `config.ts`'den okunur.
- `authInterceptor.ts` — fetch/axios interceptor:
  - Her isteğe `Authorization: Bearer <JWT>` ekler.
  - `401` dönerse JWT'yi temizler ve `/login`'e yönlendirir.
- `ProtectedRoute.tsx` — route guard component'i (aşağıda).

`**useCurrentUser()` hook'u** (`isr-web-core`'dan export)

```ts
// isr-core-modules/isr-web-core/src/auth/useCurrentUser.ts
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

### 8.3. `shellSlice` yapısı

```ts
// isr-mvp/isr-mvp-web-shell/src/store/shellSlice.ts
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

### 8.4. `ProtectedRoute` component'i

**Önemli**: Aşağıdaki `Navigate`, `**@tanstack/react-router`** paketinden gelir — `react-router-dom` ile karıştırılmamalıdır. TanStack Router, mount anında yönlendirme için bu bileşeni önerir (`useEffect` + `useNavigate` yerine).

```tsx
// isr-mvp/isr-mvp-web-shell/src/auth/ProtectedRoute.tsx
import { Navigate } from '@tanstack/react-router';
import { useCurrentUser } from 'isr-web-core';
import { ForbiddenPage } from './ForbiddenPage'; // shell içi stub / gerçek 403 sayfası

interface Props {
  permissions: string[];
  children: React.ReactNode;
}

export function ProtectedRoute({ permissions, children }: Props) {
  const { isAuthenticated, hasPermission } = useCurrentUser();

  // replace: true → login redirect history'yi şişirmez (geri tuşu döngüsü olmaz)
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const missing = permissions.filter((p) => !hasPermission(p));
  if (missing.length > 0) return <ForbiddenPage missing={missing} />;

  return <>{children}</>;
}
```

> İleride route bazlı `beforeLoad` içinde `throw redirect({ to: '/login' })` kullanmak da mümkün; MVP'de bu wrapper yeterli ve tüm manifest route'larına tek pattern ile uygulanır.

Menü layout'u da (`RootLayout`) `hasPermission` üzerinden filtreler — permission'ı olmayan kullanıcı menü item'ını **görmez**.

### 8.5. Login akışı (end-to-end)

```
1. Kullanıcı shell'i ilk açar (JWT yok) → /login'e yönlendirilir.
2. LoginPage form submit → POST /auth/login (isr-auth-backend).
3. Backend dummy user'ı doğrular, JWT üretir ve döner.
4. Shell:
     - JWT'yi localStorage'a kaydeder.
     - shellSlice.authSuccess dispatch'ler (token + user + permissions).
5. Router kullanıcıyı ilk eşleşen manifest route'una yönlendirir.
6. Her route render'ında <ProtectedRoute permissions=[...]> kontrol eder.
7. Her API isteğinde authInterceptor JWT ekler.
8. Sayfa yenilenirse: shell boot'ta localStorage'dan JWT'yi okur → GET /me → shellSlice.authSuccess.
9. JWT expire olursa (401) → interceptor logout dispatch + /login redirect.
```

### 8.6. JWT storage (MVP → Production)

- **MVP**: `localStorage` + Redux memory. Dev pragmatik, XSS'e karşı savunmasız.
- **Production (Keycloak geçişinde)**: `httpOnly` cookie + refresh token rotation. Backend cookie'yi set eder, frontend JS'ten erişemez.

### 8.7. Kural — modüller

- **Hiçbir domain modülü** (`isr-gis-web`, `isr-video-web`, ...) auth bilgisi **tutmaz**.
- Permission kontrolü için `useCurrentUser().hasPermission(...)` kullanır.
- Token asla modüle parametre olarak geçilmez — `authInterceptor` tüm API istekleri için otomatik ekler.

### 8.8. MVP'de atlanan, ileride eklenecekler

- Rate limiting / brute-force koruması (Bucket4j vs.).
- Password hashing (MVP'de plaintext karşılaştırma, Keycloak geçişinde konu dışı).
- CSRF koruması (Keycloak + cookie'ye geçişte aktif edilir).
- Multi-tenant / compartment.
- Permission inheritance / role hierarchy.
- Audit log.

Bunların tümü **Bölüm 12 Roadmap**'te; MVP'nin `useCurrentUser` + `ProtectedRoute` soyutlamaları bu geçişi non-breaking kılar.

---

## 9) Cross-module Etkileşim Kuralları

**İzinli**

- Başka modülün **state'ini okumak**: `useSelector((s: RootState) => s.gis.selectedLayer)`.
- Başka modülün **export ettiği hook'u kullanmak**: `useIntelligenceById(id)`.
- `isr-web-core`'daki ortak tipleri / utility'leri kullanmak.

**Yasak**

- Başka modülün slice action'larını dışarıdan `dispatch` etmek (ör. `dispatch(gisActions.setLayer(...))` Video modülünden). Modül, kendi slice'ını yalnızca kendi sınırları içinde mutate eder.
- Bir modülü başka bir modülün kaynak kodundan import etmek (yatay import). Ortak ihtiyaç → `isr-web-core`.
- `isr-web-core` dışında paylaşılan mutable singleton.

**Yazma ihtiyacı olursa**

- Modül kendi export'unda bir **action-hook** sunar: `export function useGisActions() { ... }`. Tüketen modül bunu çağırır; iç implementation modülün kontrolündedir (gelecekte slice şeması değişse bile consumer'lar kırılmaz).
- Tamamen decoupled iletişim için shell'de global bir event bus (`mitt`) kurulabilir. **Varsayılan değil, son çare**.

---

## 10) Manifest → TanStack Router Köprüsü

Shell, modüllerin manifest'lerini toplar ve TanStack Router'a çevirir:

```ts
// isr-mvp/isr-mvp-web-shell/src/router/index.ts
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { gisModule } from 'isr-gis-web';
import { intelligenceModule } from 'isr-intelligence-web';
import { videoModule } from 'isr-video-web';
import { searchModule } from 'isr-search-web';
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

Aynı `allModules` dizisi **menü render'ı** için de kullanılır (layout sidebar `m.menu`'leri flatten'leyip permission filter'dan geçirir).

---

## 11) Testing Stratejisi

**Modül-içi (her pakette `__tests__/` veya `*.test.ts`)**

- **Vitest** + `@testing-library/react`.
- **Slice testleri**: pure reducer input/output.
- **Hook testleri**: `renderHook` + mock `QueryClient`.
- **Component testleri**: gerekli `Provider`'larla (store + queryClient) sarmalanır.

**Shell integration test**

- `isr-mvp-web-shell`'de tek bir test, manifest → store → router kurulumunu baştan sona kurar ve:
  - Tüm modül reducer'ları store'da kayıtlı mı?
  - Cross-module dummy demo (`Merhaba shell + gis + video + intel + search`) doğru render oluyor mu?

**E2E**

- **Playwright**, shell'i dev server üzerinde açar.
- Smoke test: login → her modülün bir sayfasına navigasyon → console error yok.

**CI**

- Multi-repo'da CI **per-repo** çalışır: her repo kendi `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm lint` (ve shell için `pnpm build`) zincirini koşar. Hangi repo'ların etkilendiği, downstream tüketicilerin `package.json`'larındaki `file:` referanslarından çıkartılır (ör. `isr-web-core`'da bir kırılma için 5 tüketici repo'nun pipeline'ı tetiklenir).

---

## 12) İleride (Roadmap — MVP kapsamı dışı)

Bu notlar mimarinin **büyüme yönünü** işaretler, MVP'de implement edilmez:

- **Keycloak / OIDC entegrasyonu**: `isr-auth-backend` Keycloak'a delege edilir (authorize → token exchange → `/me` mapping). Shell `oidc-client-ts` ile Authorization Code + PKCE akışına geçer. JWT storage `httpOnly` cookie + refresh token rotation'a döner. `useCurrentUser` ve `ProtectedRoute` soyutlamaları aynen kalır → modül kodu **değişmez**. Bu geçiş, user persistence (DB), password hashing, MFA, audit log, rate limiting gibi production gereksinimleri ile birlikte ele alınır.
- **Shared UI kit**: `isr-core-modules/isr-web-ui/` olarak tema + base component'ler (Button, DataTable, FormField, DialogShell...) tek pakette. Tüm modüller MUI'yi bu paket üzerinden tüketir. Visual/UX tutarlılığı için 3-6. aylarda eklenmesi önerilir.
- **Search infrastructure ayrımı**: İkinci aranabilir entity eklendiğinde `isr-search-web` generic bir `useSearch(index, query)` hook'u export edecek; Intelligence dahil tüm entity modülleri kendi API'lerinde bunu kullanacak (şu an `executeQuery` Intelligence API'de).
- **Lazy slice registration**: Modül sayısı 10+'a çıkarsa RTK 2.0 `combineSlices` + `injectSlices`'a geçiş. Shell başlangıçta sadece `shellSlice`'ı bilir; modül yüklendiğinde kendi slice'ını store'a inject eder.
- **Module Federation**: Modüllerin ayrı deploy cycle'ı gerekirse (bağımsız release) Vite Module Federation düşünülebilir. MVP'de ihtiyaç yok.

---

## 13) Implementation Checklist (iskeletin eksiksiz kurulduğunu doğrular)

Aşağıdaki maddelerin **tamamı** yeşil olduğunda MVP iskeleti tamamlanmıştır:

- 8 git reposu workspace kökünde sibling olarak duruyor: `isr-tools/`, `isr-mvp/`, `isr-core-modules/`, `isr-intelligence-modules/`, `isr-gis-modules/`, `isr-video-modules/`, `isr-search-modules/`, `isr-auth-modules/`. `isr-tools/` izole toolchain (JDK 21 + Maven 3.9.15 + Node LTS + pnpm) sahibidir; her sibling `..\isr-tools\env.ps1`'i dot-source eder.
- Shell repo'sunda (`isr-mvp/isr-mvp-web-shell/`) `package.json`, `tsconfig.json` (+ `tsconfig.base.json`), `vite.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.npmrc` ve `scripts/install-siblings.mjs` (`pnpm bootstrap:siblings` komutu) hazır.
- Her frontend repo'sunda (5 modül + shell) **per-repo** `.eslintrc.cjs` (`no-restricted-imports`), `.npmrc` (registry pin + `node-linker=isolated` + paylaşılan `store-dir=../../isr-tools/.tools/pnpm-store`), `.gitignore` ve self-contained `tsconfig.json` mevcut.
- Modüller arası bağımlılıklar `package.json` içinde `file:../../isr-*-modules/...` (veya `file:../../isr-core-modules/...`) yoluyla bildirilir; her tüketici, sibling repo'lar checkout edildikten sonra `pnpm bootstrap:siblings` + `pnpm install` ile kurulur.
- `isr-web-core/package.json`: `peerDependencies` içinde `react`, `react-dom`, `react-redux` tanımlı (sürüm aralıkları shell ile uyumlu); core bunları kendi `dependencies`'ine eklemez.
- 6 frontend paketi mevcut: `isr-mvp-web-shell`, `isr-gis-web`, `isr-video-web`, `isr-intelligence-web`, `isr-search-web`, `isr-web-core`.
- 1 backend servisi mevcut: `isr-auth-backend` (Spring Boot, dummy users).
- Her paketin `package.json`, `tsconfig.json`, `src/index.ts` dosyası var (frontend); auth-backend için `pom.xml` / `build.gradle` + `application.yml`.
- Her domain modülü `AppModule` manifest'ini export ediyor.
- Her domain modülünün `config.ts` dosyası ve ilgili kütüphaneleri (GIS için **CesiumJS**) `package.json`'a yazılı.
- Her modülde `dummy` alanlı slice var; `isr-web-core` `RootState`'i shell'de augment edilmiş.
- Shell `configureStore` tüm modül reducer'larını birleştiriyor; `<Provider>` ile uygulama sarılı.
- Shell `QueryClient` + `QueryClientProvider` mount ediyor; DevTools dev modunda görünür.
- Shell TanStack Router'ı manifest'lerden dinamik kuruyor; `<ProtectedRoute>` her route'u sarıyor.
- `isr-auth-backend` ayakta (`:8081`); `POST /auth/login`, `GET /me`, `POST /auth/logout` çalışıyor.
- Shell `LoginPage` + `authApi` + `authInterceptor` + `useCurrentUser` kurulu; localStorage'dan JWT resume çalışıyor.
- `admin/admin123` ile login → tüm modüllere erişim; `viewer/viewer123` ile login → yalnızca izinli modüller menüde görünür, diğerleri `ForbiddenPage`.
- Her modülün bir sayfası, **beş dummy'yi** concat ederek `Merhaba {shell} + {gis} + {video} + {intel} + {search}` render ediyor.
- Intelligence entity + API + 3 TanStack hook (`useIntelligenceById`, `useIntelligenceQuery`, `useDeleteIntelligence`) `isr-intelligence-web`'den export ediliyor; GIS/Video/Search bir sayfada bu hook'u kullanıyor.
- Vitest "manifest integration test" yeşil.
- `pnpm dev` çalıştırınca shell açılıyor, login → 4 modülün 1'er sayfasına navigasyon sorunsuz.
- HMR kanıtı: `isr-gis-web/src/pages/MapPage.tsx` dosyasında bir değişiklik → manuel build olmadan, shell tarayıcıda state'i koruyarak yenileniyor.

