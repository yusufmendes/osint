// Loose ambient declaration so `import.meta.env.VITE_*` typechecks without
// dragging the full `vite` devDep into this domain module. The shell, which
// owns Vite, provides the real runtime values.
interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
