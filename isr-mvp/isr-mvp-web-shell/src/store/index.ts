import { configureStore } from '@reduxjs/toolkit';
import { gisReducer } from 'isr-gis-web';
import { videoReducer } from 'isr-video-web';
import { intelligenceReducer } from 'isr-intelligence-web';
import { searchReducer } from 'isr-search-web';
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

export type AppDispatch = typeof store.dispatch;
