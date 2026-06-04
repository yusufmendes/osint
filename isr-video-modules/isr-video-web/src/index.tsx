import { lazy } from 'react';
import type {
  AppModule,
  ModuleMenuItem,
  ModuleRibbonItem,
  ModuleRoute,
  RibbonTabId,
} from 'isr-web-core';

const VideoPlayer = lazy(() => import('./pages/VideoPlayer'));

interface VideoSourceGroup {
  tab: Extract<RibbonTabId, 'ankas' | 'baykar' | 'gozcu'>;
  provider: 'ANKAS' | 'BAYKAR' | 'GÖZCÜ';
  prefix: 'ANKA' | 'BAYKAR' | 'GÖZCÜ';
  slug: 'ankas' | 'baykar' | 'gozcu';
  orderBase: number;
}

const VIDEO_SOURCE_GROUPS: VideoSourceGroup[] = [
  { tab: 'ankas', provider: 'ANKAS', prefix: 'ANKA', slug: 'ankas', orderBase: 10 },
  { tab: 'baykar', provider: 'BAYKAR', prefix: 'BAYKAR', slug: 'baykar', orderBase: 10 },
  { tab: 'gozcu', provider: 'GÖZCÜ', prefix: 'GÖZCÜ', slug: 'gozcu', orderBase: 10 },
];

function AnkaStealthIcon() {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true">
      <path d="M4 21.5 28 9.5 56 8.5 45 17.5 60 23.5 41 24.8 34 34 29.5 25.5 16 28.5Z" />
      <path d="M12 21.8h39M31 10v15.2M41.5 18l10.5 4.2" />
      <path d="M29.5 25.5 18 27.8M35 24.8l-4.4 7.4" />
      <circle cx="24" cy="24" r="1.35" />
      <circle cx="46" cy="20.5" r="1.35" />
    </svg>
  );
}

function BaykarUavIcon() {
  return (
    <svg viewBox="0 0 68 38" aria-hidden="true">
      <path d="M3 18.8 31.5 15.2 62 19.2" />
      <path d="M30 14.2 36 13.2 42 16.4 36 19.5 29.5 18Z" />
      <path d="M42 16.4 55 9.2 61 12.2 55.5 18.6" />
      <path d="M36 19.5 45 27.2 52.5 26.5 43.5 18.8" />
      <path d="M17 16.9 13.2 21.2M24.5 16 21.5 22.5M36 19.5v7.2M53.5 18.8v5.2" />
      <circle cx="36" cy="27.4" r="1.3" />
      <circle cx="53.5" cy="24.6" r="1.3" />
    </svg>
  );
}

function GozcuAirTrackIcon() {
  return (
    <svg viewBox="0 0 68 28" aria-hidden="true">
      <path d="M4 14.6 17.5 12.5 42.5 12.2 62.5 15.2 42.5 17.8 17.5 17.2Z" />
      <path d="M24.5 12.4 37.5 5.8 42 6.8 33.5 12.5" />
      <path d="M24.5 17.1 37.5 23.5 42 22.5 33.5 17.4" />
      <path d="M49.5 13.3 59 8.6M49.5 16.5 59 21.2" />
      <path d="M9 14.6 5 11.5M9 14.8 5 18" />
      <circle cx="20.8" cy="14.8" r="1.2" />
      <circle cx="45.2" cy="15.1" r="1.2" />
    </svg>
  );
}

function getVideoIcon(tab: VideoSourceGroup['tab']) {
  if (tab === 'ankas') return <AnkaStealthIcon />;
  if (tab === 'baykar') return <BaykarUavIcon />;
  return <GozcuAirTrackIcon />;
}

const menu: ModuleMenuItem[] = [];
const ribbon: ModuleRibbonItem[] = [];
const routes: ModuleRoute[] = [];

for (const group of VIDEO_SOURCE_GROUPS) {
  for (let index = 1; index <= 4; index += 1) {
    const label = `${group.prefix}-${index}`;
    const path = `/video/${group.slug}/${index}`;
    const permissions = ['video.player.view'];

    menu.push({ path, label, permissions });
    ribbon.push({
      path,
      label,
      permissions,
      tab: group.tab,
      group: 'İHA Video',
      order: group.orderBase + index,
      icon: getVideoIcon(group.tab),
      status: index % 2 === 1 ? 'online' : 'offline',
    });
    routes.push({
      path,
      element: <VideoPlayer provider={group.provider} source={label} />,
      permissions,
    });
  }
}

export const videoModule: AppModule = {
  id: 'video',
  title: 'Video',
  permissions: ['video.player.view'],
  menu,
  ribbon,
  routes,
};

export { videoActions, videoReducer } from './store/videoSlice';
export type { VideoState } from './store/videoSlice';
export { videoConfig } from './config';
