import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

const SearchPage = lazy(() => import('./pages/SearchPage'));

function SearchRibbonIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12.5" cy="12.5" r="6.4" />
      <path d="m17.2 17.2 5.2 5.2M8.2 12.5h8.6M12.5 8.2v8.6" />
      <path d="M5.8 5.8h4M5.8 5.8v4M22.2 22.2h-4M22.2 22.2v-4" />
    </svg>
  );
}

export const searchModule: AppModule = {
  id: 'search',
  title: 'Search',
  permissions: ['search.panel.view'],
  menu: [{ path: '/search/panel', label: 'Arama', permissions: ['search.panel.view'] }],
  ribbon: [
    {
      path: '/search/panel',
      label: 'Arama',
      permissions: ['search.panel.view'],
      tab: 'araclar',
      group: 'Arama',
      order: 30,
      icon: <SearchRibbonIcon />,
      workspace: { mode: 'multi' },
    },
  ],
  routes: [{ path: '/search/panel', element: <SearchPage />, permissions: ['search.panel.view'] }],
};

export { searchActions, searchReducer } from './store/searchSlice';
export type { SearchState } from './store/searchSlice';
export { searchConfig } from './config';
