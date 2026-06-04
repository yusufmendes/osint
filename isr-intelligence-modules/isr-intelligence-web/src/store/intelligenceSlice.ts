import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IntelligenceState {
  dummy: string;
  draftHeader: string;
}

const initialState: IntelligenceState = {
  dummy: 'intel-hello',
  draftHeader: '',
};

export const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => {
      s.dummy = a.payload;
    },
    setDraftHeader: (s, a: PayloadAction<string>) => {
      s.draftHeader = a.payload;
    },
  },
});

export const intelligenceActions = intelligenceSlice.actions;
export const intelligenceReducer = intelligenceSlice.reducer;
