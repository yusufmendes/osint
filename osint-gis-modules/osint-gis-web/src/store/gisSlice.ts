import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface GisLayer {
  id: string;
  name: string;
  visible: boolean;
}

export interface GisState {
  dummy: string;
  selectedLayerId: string | null;
  layers: GisLayer[];
}

const initialState: GisState = {
  dummy: 'gis-hello',
  selectedLayerId: null,
  layers: [],
};

export const gisSlice = createSlice({
  name: 'gis',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
    setLayers: (s, a: PayloadAction<GisLayer[]>) => { s.layers = a.payload; },
    selectLayer: (s, a: PayloadAction<string | null>) => { s.selectedLayerId = a.payload; },
    toggleLayer: (s, a: PayloadAction<string>) => {
      const l = s.layers.find((x) => x.id === a.payload);
      if (l) l.visible = !l.visible;
    },
  },
});

export const gisActions = gisSlice.actions;
export const gisReducer = gisSlice.reducer;
