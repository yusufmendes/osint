import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VideoState {
  dummy: string;
  playing: boolean;
  currentStreamId: string | null;
}

const initialState: VideoState = {
  dummy: 'video-hello',
  playing: false,
  currentStreamId: null,
};

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setDummy: (s, a: PayloadAction<string>) => { s.dummy = a.payload; },
    play: (s, a: PayloadAction<string>) => {
      s.playing = true;
      s.currentStreamId = a.payload;
    },
    pause: (s) => { s.playing = false; },
  },
});

export const videoActions = videoSlice.actions;
export const videoReducer = videoSlice.reducer;
