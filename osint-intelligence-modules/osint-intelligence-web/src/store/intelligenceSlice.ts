import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IntelligenceState {
  dummy: string;
  selectedId: string | null;
}

const initialState: IntelligenceState = {
  dummy: 'intel-hello',
  selectedId: null,
};

export const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
    setSelected: (s, a: PayloadAction<string | null>) => { s.selectedId = a.payload; },
  },
});

export const intelligenceActions = intelligenceSlice.actions;
export const intelligenceReducer = intelligenceSlice.reducer;
