import { shellConfig } from '../config';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface MeResponse {
  userId: string;
  username: string;
  permissions: string[];
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${shellConfig.authBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Auth ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe(token: string): Promise<MeResponse> {
  return request<MeResponse>('/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logout(token: string): Promise<void> {
  return request<void>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
