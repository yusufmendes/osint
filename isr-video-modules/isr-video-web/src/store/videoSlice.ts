import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VideoState {
  dummy: string;
  currentSrc: string | null;
  paused: boolean;
}

const initialState: VideoState = {
  dummy: 'video-hello',
  currentSrc: null,
  paused: true,
};

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => {
      s.dummy = a.payload;
    },
    play: (s, a: PayloadAction<string>) => {
      s.currentSrc = a.payload;
      s.paused = false;
    },
    pause: (s) => {
      s.paused = true;
    },
  },
});

export const videoActions = videoSlice.actions;
export const videoReducer = videoSlice.reducer;
