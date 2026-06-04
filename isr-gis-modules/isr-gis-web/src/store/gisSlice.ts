import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface GisState {
  dummy: string;
  selectedLayerId: string | null;
}

const initialState: GisState = {
  dummy: 'gis-hello',
  selectedLayerId: null,
};

export const gisSlice = createSlice({
  name: 'gis',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => {
      s.dummy = a.payload;
    },
    selectLayer: (s, a: PayloadAction<string | null>) => {
      s.selectedLayerId = a.payload;
    },
  },
});

export const gisActions = gisSlice.actions;
export const gisReducer = gisSlice.reducer;
