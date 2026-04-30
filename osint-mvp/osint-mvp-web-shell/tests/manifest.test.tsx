import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { gisReducer, gisModule } from 'osint-gis-web';
import { videoReducer, videoModule } from 'osint-video-web';
import { intelligenceReducer, intelligenceModule } from 'osint-intelligence-web';
import { searchReducer, searchModule } from 'osint-search-web';
import { shellReducer, shellActions } from '../src/store/shellSlice';
import '../src/store/augmentations';
import { Suspense } from 'react';

function makeStore() {
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

describe('manifest integration', () => {
  it('tum modul reducerlari store\'da kayitli', () => {
    const store = makeStore();
    const s = store.getState();
    expect(s.shell.dummy).toBe('shell-hello');
    expect(s.gis.dummy).toBe('gis-hello');
    expect(s.video.dummy).toBe('video-hello');
    expect(s.intelligence.dummy).toBe('intel-hello');
    expect(s.search.dummy).toBe('search-hello');
  });

  it('her modul AppModule manifestini export ediyor', () => {
    const ids = [gisModule.id, videoModule.id, intelligenceModule.id, searchModule.id];
    expect(ids.sort()).toEqual(['gis', 'intelligence', 'search', 'video']);
    for (const m of [gisModule, videoModule, intelligenceModule, searchModule]) {
      expect(m.menu.length).toBeGreaterThan(0);
      expect(m.routes.length).toBeGreaterThan(0);
      for (const r of m.routes) {
        expect(r.permissions.length).toBeGreaterThan(0);
      }
    }
  });

  it('shell layout cross-module dummylari concat eder (manifest -> route element)', async () => {
    const store = makeStore();
    store.dispatch(shellActions.authSuccess({
      token: 'test',
      user: { id: 'u-1', username: 'admin', permissions: ['gis.map.view'] },
    }));

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // GIS modulunun manifest'inden ilk route'u al -> bu MapPage'i lazy render eder.
    const mapRouteElement = gisModule.routes[0].element;

    render(
      <Provider store={store}>
        <QueryClientProvider client={qc}>
          <Suspense fallback={<span>loading</span>}>
            {mapRouteElement}
          </Suspense>
        </QueryClientProvider>
      </Provider>,
    );

    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Merhaba');
    expect(h1.textContent).toContain('shell-hello');
    expect(h1.textContent).toContain('gis-hello');
    expect(h1.textContent).toContain('video-hello');
    expect(h1.textContent).toContain('intel-hello');
    expect(h1.textContent).toContain('search-hello');
  });
});
