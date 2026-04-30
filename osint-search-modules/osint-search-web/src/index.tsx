import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const SearchPage = lazy(() => import('./pages/SearchPage'));

export const searchModule: AppModule = {
  id: 'search',
  title: 'Search',
  permissions: ['search.panel.view'],
  menu: [
    { path: '/search/panel', label: 'Arama', permissions: ['search.panel.view'] },
  ],
  routes: [
    { path: '/search/panel', element: <SearchPage />, permissions: ['search.panel.view'] },
  ],
};

export { searchReducer, searchActions, searchSlice } from './store/searchSlice';
export type { SearchState } from './store/searchSlice';
export { searchConfig } from './config';
