import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ShellUser {
  id: string;
  username: string;
  permissions: string[];
}

export interface ShellState {
  dummy: string;
  user: ShellUser | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
  activeMenuPath: string | null;
}

const initialState: ShellState = {
  dummy: 'shell-hello',
  user: null,
  authStatus: 'idle',
  token: null,
  activeMenuPath: null,
};

export const shellSlice = createSlice({
  name: 'shell',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
    authLoading: (s) => { s.authStatus = 'loading'; },
    authSuccess: (s, a: PayloadAction<{ token: string; user: ShellUser }>) => {
      s.authStatus = 'authenticated';
      s.token = a.payload.token;
      s.user = a.payload.user;
    },
    authFail: (s) => {
      s.authStatus = 'unauthenticated';
      s.token = null;
      s.user = null;
    },
    logout: (s) => {
      s.authStatus = 'unauthenticated';
      s.token = null;
      s.user = null;
    },
    setActiveMenu: (s, a: PayloadAction<string | null>) => { s.activeMenuPath = a.payload; },
  },
});

export const shellActions = shellSlice.actions;
export const shellReducer = shellSlice.reducer;
