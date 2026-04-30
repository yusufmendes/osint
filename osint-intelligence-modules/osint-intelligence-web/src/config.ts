/**
 * osint-intelligence-web modulunun ic davranis ve dis dunya ayarlari.
 * Modulun "config.ts" sozlesmesi: tum remote endpoint ve modul-icin
 * sabitler bu dosyada toplanir. Build-time env (Vite) `import.meta.env`'den
 * okunur, calisma zamani override icin window'a duzeltici eklenebilir.
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
