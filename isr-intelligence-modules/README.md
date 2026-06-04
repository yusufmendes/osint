# isr-intelligence-modules

Intelligence data domain. Hosts the entity, the API client and three TanStack
Query hooks (`useIntelligenceById`, `useIntelligenceQuery`,
`useDeleteIntelligence`) that the visualization domains (gis / video /
search) consume.

```
isr-intelligence-modules/
└─ isr-intelligence-web/   manifest + entity + api + cross-module hooks
```

Source-only consumption (`"main": "./src/index.tsx"`); no build step.

## Architectural rule

`isr-intelligence-web` may depend on `isr-web-core` only. It MUST NOT depend
on any visualization sibling (`isr-gis-web`, `isr-video-web`,
`isr-search-web`). The local `.eslintrc.cjs` enforces that.

## Local install

```powershell
. ..\isr-tools\env.ps1
cd isr-intelligence-web
pnpm install
pnpm typecheck
pnpm test
```

For the full developer workflow, see
[`../isr-mvp/isr-mvp-web-shell/README.md`](../isr-mvp/isr-mvp-web-shell/README.md).
