import type { ReactNode } from 'react';

export interface ModuleMenuItem {
  path: string;
  label: string;
  permissions: string[];
}

export type RibbonTabId = 'giris' | 'araclar' | 'ankas' | 'baykar' | 'gozcu';
export type WorkspaceWindowMode = 'single' | 'multi';

export interface WorkspaceWindowConfig {
  mode: WorkspaceWindowMode;
  title?: string;
}

export interface ModuleRibbonItem extends ModuleMenuItem {
  tab: RibbonTabId;
  group: string;
  order: number;
  icon: ReactNode;
  isDefault?: boolean;
  status?: 'online' | 'offline';
  workspace?: WorkspaceWindowConfig;
}

export interface ModuleRoute {
  path: string;
  element: ReactNode;
  permissions: string[];
}

/**
 * The runtime contract every domain module exports as `<domain>Module`.
 * The shell discovers manifests, builds the menu and registers TanStack Router
 * routes from this shape.
 */
export interface AppModule {
  id: string;
  title: string;
  permissions: string[];
  menu: ModuleMenuItem[];
  ribbon: ModuleRibbonItem[];
  routes: ModuleRoute[];
}
