# isr-core-modules

Bottom of the ISR MVP frontend dependency graph.

```
isr-core-modules/
└─ isr-web-core/      shared types (`AppModule`, `RootState`), useCurrentUser hook
```

Source-only: `"main": "./src/index.ts"`. No build step; Vite bundles the
source through the shell.

## Architectural rule

`isr-web-core` is the bottom of the dependency graph - it MUST NOT depend
on any domain or shell module. The `.eslintrc.cjs` here enforces that.

## Local install

```powershell
. ..\isr-tools\env.ps1
cd isr-web-core
pnpm install
pnpm typecheck
pnpm test
```

The shell's `pnpm bootstrap:siblings` will do this for you automatically.

For the full developer workflow, see
[`../isr-mvp/isr-mvp-web-shell/README.md`](../isr-mvp/isr-mvp-web-shell/README.md).
