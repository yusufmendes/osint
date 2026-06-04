import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

const MapPage = lazy(() => import('./pages/MapPage'));

function MapRibbonIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M5 8.5 11.2 5l6 3.5 5.8-3.2v15.2l-5.8 3.2-6-3.5L5 23.5Z" />
      <path d="M11.2 5v15.2M17.2 8.5v15.2" />
      <path d="M8.2 15.8h11.6M14 11.2l2.2 2.2L14 15.6l-2.2-2.2Z" />
    </svg>
  );
}

export const gisModule: AppModule = {
  id: 'gis',
  title: 'GIS',
  permissions: ['gis.map.view'],
  menu: [{ path: '/gis/map', label: '3B Harita', permissions: ['gis.map.view'] }],
  ribbon: [
    {
      path: '/gis/map',
      label: '3B Harita',
      permissions: ['gis.map.view'],
      tab: 'giris',
      group: 'Harita',
      order: 20,
      icon: <MapRibbonIcon />,
      isDefault: true,
    },
  ],
  routes: [{ path: '/gis/map', element: <MapPage />, permissions: ['gis.map.view'] }],
};

export { gisActions, gisReducer } from './store/gisSlice';
export type { GisState } from './store/gisSlice';
export { gisConfig } from './config';
