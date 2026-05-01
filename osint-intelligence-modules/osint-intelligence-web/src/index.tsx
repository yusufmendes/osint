import { lazy } from 'react';
import type { AppModule } from 'osint-web-core';

const IntelligenceCrudPage = lazy(() => import('./pages/IntelligenceCrudPage'));

export const intelligenceModule: AppModule = {
  id: 'intelligence',
  title: 'Intelligence',
  permissions: ['intelligence.crud.view'],
  menu: [
    { path: '/intelligence/crud', label: 'Create Intelligence', permissions: ['intelligence.crud.view'] },
  ],
  routes: [
    { path: '/intelligence/crud', element: <IntelligenceCrudPage />, permissions: ['intelligence.crud.view'] },
  ],
};

export { intelligenceReducer, intelligenceActions, intelligenceSlice } from './store/intelligenceSlice';
export type { IntelligenceState } from './store/intelligenceSlice';

export { useIntelligenceById } from './hooks/useIntelligenceById';
export { useIntelligenceQuery } from './hooks/useIntelligenceQuery';
export { useDeleteIntelligence } from './hooks/useDeleteIntelligence';

export type {
  Intelligence,
  IntelligenceCreateDto,
  IntelligenceUpdateDto,
  IntelligenceQuery,
  IntelligenceQueryResult,
} from './domain/intelligence';

export { intelligenceConfig } from './config';
export { intelligenceQueryKeys } from './api/intelligenceApi';
