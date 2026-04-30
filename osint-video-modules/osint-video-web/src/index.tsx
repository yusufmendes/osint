import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));

export const videoModule: AppModule = {
  id: 'video',
  title: 'Video',
  permissions: ['video.player.view'],
  menu: [
    { path: '/video/player', label: 'Video Player', permissions: ['video.player.view'] },
  ],
  routes: [
    { path: '/video/player', element: <VideoPlayer />, permissions: ['video.player.view'] },
  ],
};

export { videoReducer, videoActions, videoSlice } from './store/videoSlice';
export type { VideoState } from './store/videoSlice';
export { videoConfig } from './config';
