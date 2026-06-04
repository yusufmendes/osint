export interface SearchConfig {
  remote: {
    searchEndpoint: string;
  };
  ui: {
    debounceMs: number;
    pageSize: number;
  };
}

export const searchConfig: SearchConfig = {
  remote: {
    searchEndpoint: import.meta.env?.VITE_SEARCH_ENDPOINT ?? 'http://localhost:8983/solr',
  },
  ui: {
    debounceMs: 250,
    pageSize: 25,
  },
};
