export interface IntelligenceConfig {
  remote: {
    apiBaseUrl: string;
    solrBaseUrl: string;
  };
  cache: {
    staleTimeMs: number;
    gcTimeMs: number;
  };
}

export const intelligenceConfig: IntelligenceConfig = {
  remote: {
    apiBaseUrl: import.meta.env?.VITE_INTEL_API ?? 'http://localhost:8082/intelligence',
    solrBaseUrl: import.meta.env?.VITE_INTEL_SOLR ?? 'http://localhost:8983/solr/intelligence',
  },
  cache: {
    staleTimeMs: 60_000,
    gcTimeMs: 5 * 60_000,
  },
};
