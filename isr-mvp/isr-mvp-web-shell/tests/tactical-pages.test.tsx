import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { gisModule } from 'isr-gis-web';
import { searchModule } from 'isr-search-web';
import { intelligenceModule } from 'isr-intelligence-web';
import { videoModule } from 'isr-video-web';

function routeElement(module: { routes: { path: string; element: React.ReactNode }[] }, path: string) {
  const route = module.routes.find((item) => item.path === path);
  expect(route).toBeDefined();
  return route!.element;
}

function renderRoute(element: React.ReactNode) {
  render(<Suspense fallback={<div>loading</div>}>{element}</Suspense>);
}

describe('tactical module pages', () => {
  it('renders the GIS Cesium globe with layer manager overlays', async () => {
    renderRoute(routeElement(gisModule, '/gis/map'));

    const mapSurface = await screen.findByTestId('gis-map-surface', {}, { timeout: 10000 });
    expect(mapSurface).toBeInTheDocument();
    expect(mapSurface).toHaveAttribute('data-map-engine', 'cesiumjs');
    expect(mapSurface).toHaveAttribute('data-imagery', 'cyan-command-world-map');
    expect(mapSurface).toHaveAttribute('data-map-tone', 'cyan-command-globe');
    expect(screen.getByTestId('gis-cesium-globe')).toHaveAttribute(
      'data-globe-theme',
      'cyan-command',
    );
    expect(screen.queryByText('A11')).not.toBeInTheDocument();
    expect(screen.queryByText(/Harita Merkezi/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('gis-layer-manager')).toHaveAttribute(
      'data-visual-style',
      'tactical-neomorphic',
    );
    expect(screen.getByTestId('gis-layer-manager')).toHaveAttribute(
      'data-surface-family',
      'command-glass',
    );
    expect(screen.getByTestId('gis-layer-manager')).toHaveAttribute(
      'data-radial-model',
      'corner-panel-radial',
    );
    expect(screen.getByTestId('gis-layer-manager')).toHaveAttribute(
      'data-radial-source',
      'top-left-panel-corner',
    );
    expect(screen.getByTestId('gis-layer-manager')).toHaveAttribute('data-radial-size', '112x112');
    expect(screen.getByTestId('gis-tool-strip')).toHaveAttribute(
      'data-visual-style',
      'tactical-neomorphic',
    );
    expect(screen.getByTestId('gis-tool-strip')).toHaveAttribute(
      'data-radial-model',
      'corner-panel-radial',
    );
    expect(screen.getByTestId('gis-tool-strip')).toHaveAttribute(
      'data-radial-source',
      'top-left-panel-corner',
    );
    expect(screen.getByTestId('gis-tool-strip')).toHaveAttribute('data-radial-size', '112x112');
    expect(screen.getByTestId('gis-tool-strip')).toHaveAttribute(
      'data-hover-model',
      'left-rail-orb-hover',
    );
    expect(screen.getAllByTestId('gis-tool-strip-icon')[0]).toHaveAttribute(
      'data-hover-model',
      'left-rail-orb-hover',
    );
  }, 10000);

  it('renders the Search tactical placeholder without backend logic', async () => {
    renderRoute(routeElement(searchModule, '/search/panel'));

    expect(await screen.findByTestId('search-page-shell')).toBeInTheDocument();
    expect(screen.getByText('Arama')).toBeInTheDocument();
  });

  it('renders Intelligence create and manage tactical placeholders', async () => {
    renderRoute(routeElement(intelligenceModule, '/intelligence/create'));
    expect(await screen.findByTestId('intelligence-create-page')).toBeInTheDocument();

    renderRoute(routeElement(intelligenceModule, '/intelligence/manage'));
    expect(await screen.findByTestId('intelligence-manage-page')).toBeInTheDocument();
  });

  it('renders a video provider source placeholder from the ribbon route', async () => {
    renderRoute(routeElement(videoModule, '/video/ankas/1'));

    expect(await screen.findByTestId('video-surface-page')).toBeInTheDocument();
    expect(screen.getByText('ANKA-1')).toBeInTheDocument();
  });
});
