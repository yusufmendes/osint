/**
 * Manifest integration test (spec sec. 11):
 *  - All four module manifests are imported.
 *  - Domain modules provide top ribbon entries that map to routes.
 *  - All five reducers register on the global store.
 *  - The cross-module dummy demo renders the concat string correctly.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import type { RootState } from 'isr-web-core';

import { gisModule, gisReducer } from 'isr-gis-web';
import { videoModule, videoReducer } from 'isr-video-web';
import { intelligenceModule, intelligenceReducer } from 'isr-intelligence-web';
import { searchModule, searchReducer } from 'isr-search-web';

import { shellReducer } from '../src/store/shellSlice';
import { allModules } from '../src/router/manifest';

function buildStore() {
  return configureStore({
    reducer: {
      shell: shellReducer,
      gis: gisReducer,
      video: videoReducer,
      intelligence: intelligenceReducer,
      search: searchReducer,
    },
  });
}

function DummyConcatProbe() {
  const shell = useSelector((s: RootState) => (s as any).shell.dummy as string);
  const gis = useSelector((s: RootState) => (s as any).gis.dummy as string);
  const video = useSelector((s: RootState) => (s as any).video.dummy as string);
  const intel = useSelector((s: RootState) => (s as any).intelligence.dummy as string);
  const search = useSelector((s: RootState) => (s as any).search.dummy as string);
  return (
    <div>
      Merhaba {shell} + {gis} + {video} + {intel} + {search}
    </div>
  );
}

describe('manifest integration', () => {
  it('exposes all four domain manifests', () => {
    expect(allModules).toEqual(
      expect.arrayContaining([gisModule, videoModule, intelligenceModule, searchModule]),
    );
    expect(new Set(allModules.map((m) => m.id))).toEqual(
      new Set(['gis', 'video', 'intelligence', 'search']),
    );
  });

  it('every manifest declares menu and routes that share permission strings', () => {
    for (const m of allModules) {
      expect(m.menu.length).toBeGreaterThan(0);
      expect(m.routes.length).toBeGreaterThan(0);
      expect(m.ribbon.length).toBeGreaterThan(0);
      const menuPaths = new Set(m.menu.map((x) => x.path));
      for (const r of m.routes) {
        expect(menuPaths.has(r.path)).toBe(true);
      }
    }
  });

  it('ribbon items are provided by modules and map to routable pages', () => {
    const ribbonItems = allModules.flatMap((m) =>
      m.ribbon.map((item) => ({ ...item, moduleId: m.id })),
    );
    const routeByPath = new Map(
      allModules.flatMap((m) => m.routes.map((route) => [route.path, route])),
    );

    expect(ribbonItems.length).toBeGreaterThan(0);
    for (const item of ribbonItems) {
      const route = routeByPath.get(item.path);
      expect(route, `${item.label} should have a route`).toBeDefined();
      expect(route?.permissions).toEqual(item.permissions);
      expect(item.icon).toBeTruthy();
    }
  });

  it('declares the expected tactical ribbon tabs and default 3B Harita route', () => {
    const ribbonItems = allModules.flatMap((m) => m.ribbon);

    expect(new Set(ribbonItems.map((item) => item.tab))).toEqual(
      new Set(['giris', 'araclar', 'ankas', 'baykar', 'gozcu']),
    );

    const defaultItem = ribbonItems.find((item) => item.isDefault);
    expect(defaultItem).toMatchObject({
      path: '/gis/map',
      label: '3B Harita',
      tab: 'giris',
      permissions: ['gis.map.view'],
    });

    expect(ribbonItems.filter((item) => item.tab === 'giris').map((item) => item.label)).toEqual([
      '3B Harita',
    ]);
    expect(ribbonItems.filter((item) => item.tab === 'araclar').map((item) => item.label)).toEqual(
      expect.arrayContaining(['Arama', 'İstihbarat Yarat', 'İstihbarat Yönet']),
    );
    expect(ribbonItems.filter((item) => item.tab === 'ankas').map((item) => item.label)).toEqual([
      'ANKA-1',
      'ANKA-2',
      'ANKA-3',
      'ANKA-4',
    ]);
    expect(ribbonItems.filter((item) => item.tab === 'baykar').map((item) => item.label)).toEqual([
      'BAYKAR-1',
      'BAYKAR-2',
      'BAYKAR-3',
      'BAYKAR-4',
    ]);
    expect(ribbonItems.filter((item) => item.tab === 'gozcu').map((item) => item.label)).toEqual([
      'GÖZCÜ-1',
      'GÖZCÜ-2',
      'GÖZCÜ-3',
      'GÖZCÜ-4',
    ]);
    expect(ribbonItems.filter((item) => item.tab === 'ankas').map((item) => item.status)).toEqual([
      'online',
      'offline',
      'online',
      'offline',
    ]);
  });

  it('all five reducers register on the global store and seed dummy fields', () => {
    const store = buildStore();
    const s = store.getState() as any;
    expect(s.shell.dummy).toBe('shell-hello');
    expect(s.gis.dummy).toBe('gis-hello');
    expect(s.video.dummy).toBe('video-hello');
    expect(s.intelligence.dummy).toBe('intel-hello');
    expect(s.search.dummy).toBe('search-hello');
  });

  it('cross-module dummy concat renders correctly', () => {
    const store = buildStore();
    render(
      <Provider store={store}>
        <DummyConcatProbe />
      </Provider>,
    );
    expect(
      screen.getByText(
        'Merhaba shell-hello + gis-hello + video-hello + intel-hello + search-hello',
      ),
    ).toBeInTheDocument();
  });
});
