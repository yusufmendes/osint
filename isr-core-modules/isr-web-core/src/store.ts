// Augmentation target for the global Redux store schema.
//
// The shell augments this interface (see isr-web-app/isr-web-shell/src/store/augmentations.ts)
// so that every module sees a fully typed RootState without creating circular
// imports between modules and the shell.

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppRootStateSchema {
  // augmented by the shell - keep empty here
}

export type RootState = AppRootStateSchema;
