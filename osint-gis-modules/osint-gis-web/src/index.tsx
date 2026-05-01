import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const MapPage    = lazy(() => import('./pages/MapPage'));
const LayersPage = lazy(() => import('./pages/LayersPage'));

export const gisModule: AppModule = {
  id: 'gis',
  title: 'GIS',
  permissions: ['gis.map.view', 'gis.layers.view'],
  menu: [
    { path: '/gis/map',    label: 'Map',    permissions: ['gis.map.view'] },
    { path: '/gis/layers', label: 'Layers', permissions: ['gis.layers.view'] },
  ],
  routes: [
    { path: '/gis/map',    element: <MapPage />,    permissions: ['gis.map.view'] },
    { path: '/gis/layers', element: <LayersPage />, permissions: ['gis.layers.view'] },
  ],
};

export { gisReducer, gisActions, gisSlice } from './store/gisSlice';
export type { GisState, GisLayer } from './store/gisSlice';
export { gisConfig } from './config';
