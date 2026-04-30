import type { ReactNode } from 'react';

export type PermissionId = string;

export interface AppMenuItem {
  path: string;
  label: string;
  permissions: PermissionId[];
}

export interface AppRoute {
  path: string;
  element: ReactNode;
  permissions: PermissionId[];
}

export interface AppModule {
  id: string;
  title: string;
  permissions: PermissionId[];
  menu: AppMenuItem[];
  routes: AppRoute[];
}
