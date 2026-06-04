# isr-video-modules

Video visualization domain.

```
isr-video-modules/
└─ isr-video-web/    manifest + player surface
```

Source-only consumption (`"main": "./src/index.tsx"`); no build step.

## Architectural rule

`isr-video-web` may depend on `isr-web-core` and `isr-intelligence-web`. It
MUST NOT depend on `isr-gis-web` or `isr-search-web`. The local
`.eslintrc.cjs` enforces that.

## Local install

```powershell
. ..\isr-tools\env.ps1
cd isr-video-web
pnpm install
pnpm typecheck
pnpm test
```

For the full developer workflow, see
[`../isr-mvp/isr-mvp-web-shell/README.md`](../isr-mvp/isr-mvp-web-shell/README.md).
