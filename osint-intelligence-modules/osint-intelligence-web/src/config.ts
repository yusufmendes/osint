/**
 * Internal behavior and external settings for `osint-intelligence-web`.
 * The module `config.ts` contract: all remote endpoints and module-wide
 * constants live here. Build-time env (Vite) is read from `import.meta.env`;
 * runtime overrides may be wired via `window` later.
 */
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export interface IntelligenceConfig {
  apiBaseUrl: string;
  solrEndpoint: string;
  query: {
    staleTime: number;
    gcTime: number;
  };
}

export const intelligenceConfig: IntelligenceConfig = {
  apiBaseUrl: env.VITE_INTELLIGENCE_API_URL ?? 'http://localhost:8082/intelligence',
  solrEndpoint: env.VITE_INTELLIGENCE_SOLR_URL ?? 'http://localhost:8983/solr/intelligence',
  query: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  },
};
