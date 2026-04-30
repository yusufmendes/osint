/**
 * Cross-repo `RootState` paylaşımı için boş bir interface deklare edilir.
 * Shell `osint-mvp-web-shell` her modülün state tipini bu interface'e
 * `declare module 'osint-web-core'` ile augment eder. Modüller burada
 * tanımlı `RootState`'i import ederek tip-güvenli `useSelector` yapabilir
 * ama hiçbir modül diğerinin slice'ına bağımlı değildir.
 */
export interface AppRootStateSchema {
  // shell augment eder; örn:
  // shell: ShellState;
  // gis:   GisState;
}

export type RootState = AppRootStateSchema;

export type PermissionId = string;
