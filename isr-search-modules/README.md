# isr-search-modules

Search visualization domain.

```
isr-search-modules/
└─ isr-search-web/    manifest + panel surface
```

Source-only consumption (`"main": "./src/index.tsx"`); no build step.

## Architectural rule

`isr-search-web` may depend on `isr-web-core` and `isr-intelligence-web`. It
MUST NOT depend on `isr-gis-web` or `isr-video-web`. The local
`.eslintrc.cjs` enforces that.

## Local install

```powershell
. ..\isr-tools\env.ps1
cd isr-search-web
pnpm install
pnpm typecheck
pnpm test
```

For the full developer workflow, see
[`../isr-mvp/isr-mvp-web-shell/README.md`](../isr-mvp/isr-mvp-web-shell/README.md).
