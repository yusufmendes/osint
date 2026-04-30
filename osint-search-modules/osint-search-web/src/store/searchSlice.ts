import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SearchState {
  dummy: string;
  query: string;
  lastResultCount: number;
}

const initialState: SearchState = {
  dummy: 'search-hello',
  query: '',
  lastResultCount: 0,
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
    setQuery: (s, a: PayloadAction<string>) => { s.query = a.payload; },
    setLastResultCount: (s, a: PayloadAction<number>) => { s.lastResultCount = a.payload; },
  },
});

export const searchActions = searchSlice.actions;
export const searchReducer = searchSlice.reducer;
