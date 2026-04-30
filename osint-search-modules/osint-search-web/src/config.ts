const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export interface SearchConfig {
  searchEngineUrl: string;
  defaultPageSize: number;
}

export const searchConfig: SearchConfig = {
  searchEngineUrl: env.VITE_SEARCH_ENGINE_URL ?? 'http://localhost:8085/search',
  defaultPageSize: 20,
};
