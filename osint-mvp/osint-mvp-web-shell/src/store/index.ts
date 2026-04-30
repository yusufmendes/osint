import { configureStore } from '@reduxjs/toolkit';
import { gisReducer } from 'osint-gis-web';
import { videoReducer } from 'osint-video-web';
import { intelligenceReducer } from 'osint-intelligence-web';
import { searchReducer } from 'osint-search-web';
import { shellReducer } from './shellSlice';
import './augmentations';

export const store = configureStore({
  reducer: {
    shell: shellReducer,
    gis: gisReducer,
    video: videoReducer,
    intelligence: intelligenceReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
