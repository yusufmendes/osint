import { intelligenceConfig } from '../config';
import type {
  Intelligence,
  IntelligenceCreateDto,
  IntelligenceUpdateDto,
  IntelligenceQuery,
  IntelligenceQueryResult,
} from '../domain/intelligence';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${intelligenceConfig.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Intelligence API ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export async function getById(id: string): Promise<Intelligence> {
  return request<Intelligence>(`/${encodeURIComponent(id)}`);
}

export async function executeQuery(q: IntelligenceQuery): Promise<IntelligenceQueryResult> {
  return request<IntelligenceQueryResult>('/query', {
    method: 'POST',
    body: JSON.stringify(q),
  });
}

export async function deleteById(id: string): Promise<void> {
  await request<void>(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function create(dto: IntelligenceCreateDto): Promise<Intelligence> {
  return request<Intelligence>('', { method: 'POST', body: JSON.stringify(dto) });
}

export async function update(dto: IntelligenceUpdateDto): Promise<Intelligence> {
  return request<Intelligence>(`/${encodeURIComponent(dto.id)}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export const intelligenceQueryKeys = {
  all: ['intelligence'] as const,
  byId: (id: string) => ['intelligence', 'byId', id] as const,
  query: (queryHash: string) => ['intelligence', 'query', queryHash] as const,
};
