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

const base = () => shellConfig.authApiBaseUrl.replace(/\/$/, '');

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${base()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`Login failed (${res.status})`);
    return (await res.json()) as LoginResponse;
  },

  me: async (token: string): Promise<MeResponse> => {
    const res = await fetch(`${base()}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`/me failed (${res.status})`);
    return (await res.json()) as MeResponse;
  },

  logout: async (token: string): Promise<void> => {
    await fetch(`${base()}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
