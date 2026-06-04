# isr-mvp

Top-level repo of the **ISR MVP frontend** (Vite shell application) plus a
**thin Maven aggregator** that points at sibling backend repos.

```
isr-mvp/
├─ pom.xml                Maven aggregator -> ../isr-auth-modules/isr-auth-backend
├─ isr-mvp-web-shell/     Vite + pnpm shell application (canonical doc inside)
└─ Initial Implementation.md   full system spec
```

The full setup, build and run instructions live in
[`isr-mvp-web-shell/README.md`](./isr-mvp-web-shell/README.md). Start there.

## Quick reference

```powershell
# one-time per machine: bring up the toolchain
pwsh -ExecutionPolicy Bypass -File ..\isr-tools\bootstrap.ps1
. ..\isr-tools\env.ps1

# build the auth backend through the aggregator
mvn -B -ntp "-Dmaven.repo.local=$env:MAVEN_USER_HOME" package

# build the frontend
cd isr-mvp-web-shell
pnpm bootstrap:siblings
pnpm install
pnpm build
```
