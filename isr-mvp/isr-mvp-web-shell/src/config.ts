export interface ShellConfig {
  authApiBaseUrl: string;
  jwtStorageKey: string;
}

export const shellConfig: ShellConfig = {
  authApiBaseUrl: import.meta.env?.VITE_AUTH_API ?? 'http://localhost:8081',
  jwtStorageKey: 'isr.jwt',
};
