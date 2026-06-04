import { intelligenceConfig } from '../config';
import type {
  Intelligence,
  IntelligenceCreateDto,
  IntelligenceQuery,
  IntelligenceUpdateDto,
} from '../domain/intelligence';

// Single fetch helper - the shell's auth interceptor adds the Authorization
// header globally, so this layer never deals with tokens.
async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${input}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const base = () => intelligenceConfig.remote.apiBaseUrl;

// --- Stub mode -----------------------------------------------------------
// In MVP we don't have a backend service yet. When VITE_INTEL_API is unset
// or the request fails, the API falls back to a deterministic stub so the
// 4 modules can demo cross-cache hits without a running Solr.
const STUB: Intelligence[] = [
  {
    id: 'demo-1',
    header: 'Demo Intelligence #1',
    description: 'Cross-module cache demo entity served from the stub.',
    templateId: 'tpl-demo',
    createdAt: '2026-04-29T00:00:00.000Z',
    tags: ['demo', 'stub'],
  },
];
const shouldUseStub = () => !import.meta.env?.VITE_INTEL_API;

export const intelligenceApi = {
  getById: async (id: string): Promise<Intelligence> => {
    if (shouldUseStub()) {
      const hit = STUB.find((x) => x.id === id);
      if (!hit) throw new Error(`Intelligence ${id} not found (stub)`);
      return hit;
    }
    return http<Intelligence>(`${base()}/${encodeURIComponent(id)}`);
  },

  executeQuery: async (q: IntelligenceQuery): Promise<Intelligence[]> => {
    if (shouldUseStub()) return STUB;
    const url = new URL(`${base()}/_query`);
    if (q.q) url.searchParams.set('q', q.q);
    if (q.tags?.length) url.searchParams.set('tags', q.tags.join(','));
    if (q.limit !== undefined) url.searchParams.set('limit', String(q.limit));
    if (q.offset !== undefined) url.searchParams.set('offset', String(q.offset));
    return http<Intelligence[]>(url.toString());
  },

  create: async (dto: IntelligenceCreateDto): Promise<Intelligence> => {
    if (shouldUseStub()) {
      const created: Intelligence = {
        id: `stub-${Math.random().toString(36).slice(2, 8)}`,
        header: dto.header,
        description: dto.description,
        templateId: dto.templateId,
        createdAt: new Date().toISOString(),
        tags: dto.tags ?? [],
      };
      STUB.push(created);
      return created;
    }
    return http<Intelligence>(base(), { method: 'POST', body: JSON.stringify(dto) });
  },

  update: async (dto: IntelligenceUpdateDto): Promise<Intelligence> => {
    if (shouldUseStub()) {
      const idx = STUB.findIndex((x) => x.id === dto.id);
      if (idx < 0) throw new Error(`Intelligence ${dto.id} not found (stub)`);
      STUB[idx] = { ...STUB[idx]!, ...dto };
      return STUB[idx]!;
    }
    return http<Intelligence>(`${base()}/${encodeURIComponent(dto.id)}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deleteById: async (id: string): Promise<void> => {
    if (shouldUseStub()) {
      const idx = STUB.findIndex((x) => x.id === id);
      if (idx >= 0) STUB.splice(idx, 1);
      return;
    }
    await http<void>(`${base()}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

export const intelligenceQueryKeys = {
  all: ['intelligence'] as const,
  byId: (id: string) => ['intelligence', 'byId', id] as const,
  query: (q: IntelligenceQuery) => ['intelligence', 'query', JSON.stringify(q)] as const,
};
