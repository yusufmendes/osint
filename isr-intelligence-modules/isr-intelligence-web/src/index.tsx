import { lazy } from 'react';
import type { AppModule } from 'isr-web-core';

const IntelligenceCreatePage = lazy(() => import('./pages/IntelligenceCreatePage'));
const IntelligenceManagePage = lazy(() => import('./pages/IntelligenceManagePage'));

function IntelCreateIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M7 5.5h10.5L22 10v12.5H7Z" />
      <path d="M17.5 5.5V10H22M10 14h8M10 18h5" />
      <path d="M5.5 14h3M7 12.5v3" />
    </svg>
  );
}

function IntelManageIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6.5 7.5h15v4h-15ZM6.5 16.5h15v4h-15Z" />
      <path d="M9.5 11.5v5M18.5 11.5v5M11 9.5h4M11 18.5h7" />
      <circle cx="20.5" cy="9.5" r="1.1" />
      <circle cx="20.5" cy="18.5" r="1.1" />
    </svg>
  );
}

export const intelligenceModule: AppModule = {
  id: 'intelligence',
  title: 'Intelligence',
  permissions: ['intelligence.crud.view'],
  menu: [
    { path: '/intelligence/create', label: 'İstihbarat Yarat', permissions: ['intelligence.crud.view'] },
    { path: '/intelligence/manage', label: 'İstihbarat Yönet', permissions: ['intelligence.crud.view'] },
  ],
  ribbon: [
    {
      path: '/intelligence/create',
      label: 'İstihbarat Yarat',
      permissions: ['intelligence.crud.view'],
      tab: 'araclar',
      group: 'İstihbarat',
      order: 10,
      icon: <IntelCreateIcon />,
      workspace: { mode: 'single' },
    },
    {
      path: '/intelligence/manage',
      label: 'İstihbarat Yönet',
      permissions: ['intelligence.crud.view'],
      tab: 'araclar',
      group: 'İstihbarat',
      order: 20,
      icon: <IntelManageIcon />,
      workspace: { mode: 'single' },
    },
  ],
  routes: [
    {
      path: '/intelligence/create',
      element: <IntelligenceCreatePage />,
      permissions: ['intelligence.crud.view'],
    },
    {
      path: '/intelligence/manage',
      element: <IntelligenceManagePage />,
      permissions: ['intelligence.crud.view'],
    },
  ],
};

export { intelligenceActions, intelligenceReducer } from './store/intelligenceSlice';
export type { IntelligenceState } from './store/intelligenceSlice';
export { intelligenceConfig } from './config';

// Cross-module surface (consumed by GIS / Video / Search):
export { intelligenceApi, intelligenceQueryKeys } from './api/intelligenceApi';
export { useIntelligenceById } from './hooks/useIntelligenceById';
export { useIntelligenceQuery } from './hooks/useIntelligenceQuery';
export { useDeleteIntelligence } from './hooks/useDeleteIntelligence';
export type {
  Intelligence,
  IntelligenceCreateDto,
  IntelligenceQuery,
  IntelligenceUpdateDto,
} from './domain/intelligence';
