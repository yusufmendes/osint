const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export interface ShellConfig {
  authBaseUrl: string;
  appTitle: string;
}

export const shellConfig: ShellConfig = {
  authBaseUrl: env.VITE_AUTH_BASE_URL ?? 'http://localhost:8081',
  appTitle: env.VITE_APP_TITLE ?? 'OSINT MVP',
};
