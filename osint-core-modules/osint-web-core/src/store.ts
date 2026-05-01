/**
 * Declares an empty interface for cross-repo `RootState` sharing.
 * Shell `osint-mvp-web-shell` augments this interface per module state type via
 * `declare module 'osint-web-core'`. Modules import the `RootState` defined here
 * for type-safe `useSelector` without depending on another module's slice.
 */
export interface AppRootStateSchema {
  // augmented by shell; e.g.:
  // shell: ShellState;
  // gis:   GisState;
}

export type RootState = AppRootStateSchema;

export type PermissionId = string;
