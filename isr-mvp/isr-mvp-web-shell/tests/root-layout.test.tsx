import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { gisReducer } from 'isr-gis-web';
import { videoReducer } from 'isr-video-web';
import { intelligenceReducer } from 'isr-intelligence-web';
import { searchReducer } from 'isr-search-web';

import { RootLayout } from '../src/layout/RootLayout';
import { shellActions, shellReducer } from '../src/store/shellSlice';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, onClick, ...props }: any) => (
    <a
      href={to}
      data-to={to}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
  Outlet: () => <main data-testid="route-outlet" />,
}));

function buildStore(permissions: string[]) {
  const store = configureStore({
    reducer: {
      shell: shellReducer,
      gis: gisReducer,
      video: videoReducer,
      intelligence: intelligenceReducer,
      search: searchReducer,
    },
  });

  store.dispatch(
    shellActions.authSuccess({
      token: 'test-token',
      user: { id: 'u-1', username: 'admin', permissions },
    }),
  );

  return store;
}

function renderRootLayout(permissions: string[]) {
  return render(
    <Provider store={buildStore(permissions)}>
      <RootLayout />
    </Provider>,
  );
}

function advanceHoverTimer(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('RootLayout tactical command rail', () => {
  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('renders an expandable left tactical rail instead of the top ribbon shell', () => {
    vi.useFakeTimers();
    renderRootLayout([
      'gis.map.view',
      'search.panel.view',
      'intelligence.crud.view',
      'video.player.view',
    ]);

    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute(
      'data-nav-style',
      'tactical-command-rail',
    );
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute(
      'data-radial-model',
      'fixed-menu-light',
    );
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute('data-radial-size', '64x118');
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute(
      'data-height-policy',
      'content-fit',
    );
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute('data-rail-state', 'expanded');
    expect(screen.queryByTestId('main-shell-ribbon')).not.toBeInTheDocument();
    expect(screen.getByTestId('main-shell-tabs')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.queryByTestId('legacy-shell-drawer')).not.toBeInTheDocument();
    expect(screen.getByTestId('main-rail-collapse-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByTestId('main-rail-collapse-toggle')).toHaveAttribute(
      'data-placement',
      'top-left',
    );
    expect(
      screen
        .getByTestId('main-rail-collapse-toggle')
        .compareDocumentPosition(screen.getByTestId('main-shell-tabs')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    expect(railTabs.getByRole('tab', { name: 'Harita' })).toBeInTheDocument();
    expect(railTabs.getByRole('tab', { name: 'İstihbarat' })).toBeInTheDocument();
    expect(screen.getAllByTestId('rail-tab-orb')).toHaveLength(2);
    expect(screen.getAllByTestId('rail-tab-label-base')[0]).toHaveTextContent('Harita');
    expect(screen.getAllByTestId('rail-tab-label-base')[1]).toHaveTextContent('İstihbarat');
    expect(railTabs.queryByRole('tab', { name: 'Ankas' })).not.toBeInTheDocument();
    expect(railTabs.queryByRole('tab', { name: 'Baykar' })).not.toBeInTheDocument();
    expect(railTabs.queryByRole('tab', { name: 'Gözcü' })).not.toBeInTheDocument();

    const videoTabs = within(screen.getByTestId('top-video-tabs'));
    expect(videoTabs.getByRole('tab', { name: 'Ankas' })).toBeInTheDocument();
    expect(videoTabs.getByRole('tab', { name: 'Baykar' })).toBeInTheDocument();
    expect(videoTabs.getByRole('tab', { name: 'Gözcü' })).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /Arama/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: 'Harita' }));
    advanceHoverTimer(80);

    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-open-tab', 'giris');
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute(
      'data-anchor-mode',
      'rail-icon-center',
    );
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute(
      'data-anchor-layout',
      'post-toggle-rail-tab-center',
    );
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-anchor-step', '80');
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-anchor-index', '0');
    expect(screen.queryByTestId('rail-flyout-arrow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rail-flyout-category')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /3B Harita/i })).toHaveAttribute('href', '/gis/map');
    expect(screen.queryByRole('link', { name: /Arama/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: 'İstihbarat' }));
    advanceHoverTimer(80);
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-open-tab', 'araclar');
    expect(screen.getByRole('link', { name: /Arama/i })).toHaveAttribute('href', '/search/panel');
    expect(screen.getByRole('link', { name: /Arama/i })).toHaveAttribute(
      'data-testid',
      'workspace-window-launcher',
    );
    expect(screen.getByRole('link', { name: /Arama/i })).toHaveAttribute(
      'data-launch-mode',
      'multi-instance',
    );
    expect(screen.getByRole('link', { name: /Arama/i })).toHaveAttribute(
      'data-window-policy',
      'multi',
    );
    expect(screen.getByRole('link', { name: /Arama/i })).toHaveAttribute(
      'data-menu-path',
      '/search/panel',
    );

    const actions = screen.getAllByTestId('workspace-window-launcher');
    expect(actions[0]).toHaveAttribute('data-surface', 'transparent');
    expect(actions[0]).toHaveAttribute('data-shape', 'single-orbital-action');
    expect(screen.queryByTestId('rail-flyout-orb')).not.toBeInTheDocument();
    expect(screen.getByTestId('rail-command-search')).toHaveAttribute(
      'data-affordance',
      'command-search',
    );
    expect(screen.queryByTestId('rail-flyout-icon-frame')).not.toBeInTheDocument();
  });

  it('groups windowed menu pages in a bottom toolbar and restores them from previews', () => {
    vi.useFakeTimers();
    renderRootLayout(['search.panel.view', 'intelligence.crud.view']);

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);

    const searchLauncher = screen.getByRole('link', { name: /Arama/i });
    fireEvent.click(searchLauncher);
    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute(
      'data-open-count',
      '1',
    );
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-window-title',
      'Arama #1',
    );
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-menu-path',
      '/search/panel',
    );

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    fireEvent.click(screen.getByRole('link', { name: /Arama/i }));
    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute(
      'data-open-count',
      '2',
    );
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Arama #2 minimize et' }));
    expect(screen.getByTestId('workspace-window-active')).not.toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );
    expect(screen.getByTestId('workspace-taskbar')).toHaveAttribute(
      'data-open-count',
      '2',
    );
    expect(screen.getByTestId('workspace-taskbar')).toHaveAttribute(
      'data-outer-surface',
      'none',
    );
    expect(screen.getByTestId('workspace-taskbar-button')).toHaveAttribute(
      'aria-label',
      'Arama pencereleri',
    );
    expect(screen.getByTestId('workspace-taskbar-badge')).toHaveTextContent('2');
    expect(screen.getByTestId('workspace-taskbar-label-base')).toHaveAttribute(
      'data-label-source',
      'menu',
    );
    expect(screen.getByTestId('workspace-taskbar-label-base')).toHaveTextContent('Arama');

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    const searchLauncherHost = screen
      .getAllByTestId('workspace-window-launcher-host')
      .find((item) => item.getAttribute('data-menu-path') === '/search/panel');
    fireEvent.mouseEnter(searchLauncherHost!);
    expect(screen.queryByTestId('workspace-preview-panel')).not.toBeInTheDocument();

    const taskbar = screen.getByTestId('workspace-taskbar');
    fireEvent.mouseEnter(taskbar);
    expect(screen.getByTestId('workspace-taskbar-preview')).toHaveAttribute(
      'data-preview-count',
      '2',
    );
    expect(screen.getByTestId('workspace-taskbar-preview')).toHaveAttribute(
      'data-layout',
      'horizontal-thumbnail-row',
    );
    expect(screen.getAllByTestId('workspace-taskbar-preview-card')).toHaveLength(2);
    screen.getAllByTestId('workspace-taskbar-preview-card').forEach((card) => {
      expect(card).toHaveAttribute('data-preview-shape', 'square');
      expect(card).toHaveAttribute('data-menu-path', '/search/panel');
    });
    expect(screen.getByTestId('workspace-taskbar-preview')).toHaveTextContent('Arama #2');

    fireEvent.mouseLeave(taskbar);
    expect(screen.getByTestId('workspace-taskbar-preview')).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByTestId('workspace-taskbar-preview'));
    advanceHoverTimer(220);
    expect(screen.getByTestId('workspace-taskbar-preview')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('workspace-taskbar-preview'));
    advanceHoverTimer(220);
    expect(screen.queryByTestId('workspace-taskbar-preview')).not.toBeInTheDocument();
    fireEvent.mouseEnter(taskbar);

    fireEvent.click(screen.getByTestId('workspace-taskbar-label-base'));
    expect(screen.getByTestId('workspace-window-active')).not.toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );
    fireEvent.click(screen.getByTestId('workspace-taskbar-button'));
    expect(screen.getByTestId('workspace-window-active')).not.toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );

    fireEvent.click(screen.getAllByTestId('workspace-taskbar-preview-card')[1]!);
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );
  });

  it('reuses an existing single-instance menu window instead of opening duplicates', () => {
    vi.useFakeTimers();
    renderRootLayout(['intelligence.crud.view']);

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);

    const manageLauncher = screen
      .getAllByTestId('workspace-window-launcher')
      .find((item) => item.getAttribute('data-menu-path') === '/intelligence/manage');
    expect(manageLauncher).toBeDefined();
    expect(manageLauncher).toHaveAttribute('data-window-policy', 'single');

    fireEvent.click(manageLauncher!);
    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute('data-open-count', '1');
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-menu-path',
      '/intelligence/manage',
    );

    fireEvent.click(within(screen.getByTestId('workspace-window-active')).getByRole('button', { name: /minimize et/i }));
    expect(screen.queryByTestId('workspace-window-active')).not.toBeInTheDocument();

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    const reopenedManageLauncher = screen
      .getAllByTestId('workspace-window-launcher')
      .find((item) => item.getAttribute('data-menu-path') === '/intelligence/manage');
    fireEvent.click(reopenedManageLauncher!);
    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute('data-open-count', '1');
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-window-state',
      'maximized',
    );

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    const latestManageLauncher = screen
      .getAllByTestId('workspace-window-launcher')
      .find((item) => item.getAttribute('data-menu-path') === '/intelligence/manage');
    fireEvent.click(latestManageLauncher!);
    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute('data-open-count', '1');
  });

  it('keeps the hovered taskbar preview open while moving between workspace groups', () => {
    vi.useFakeTimers();
    renderRootLayout(['search.panel.view', 'intelligence.crud.view']);

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);

    fireEvent.click(screen.getByRole('link', { name: /Arama/i }));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    fireEvent.click(screen.getByRole('link', { name: /Arama/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Arama #2 minimize et' }));

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    const manageLauncher = screen
      .getAllByTestId('workspace-window-launcher')
      .find((item) => item.getAttribute('data-menu-path') === '/intelligence/manage');
    fireEvent.click(manageLauncher!);

    const taskbars = screen.getAllByTestId('workspace-taskbar');
    expect(taskbars).toHaveLength(2);

    fireEvent.mouseEnter(taskbars[0]!);
    expect(screen.getByTestId('workspace-taskbar-preview')).toHaveTextContent('Arama #2');

    fireEvent.mouseLeave(taskbars[0]!);
    fireEvent.mouseEnter(taskbars[1]!);
    expect(screen.getByTestId('workspace-taskbar-preview-card')).toHaveAttribute(
      'data-menu-path',
      '/intelligence/manage',
    );
    advanceHoverTimer(220);
    expect(screen.getByTestId('workspace-taskbar-preview-card')).toHaveAttribute(
      'data-menu-path',
      '/intelligence/manage',
    );
  });

  it('restores generic workspace windows from session storage after a page refresh', async () => {
    vi.useFakeTimers();
    const view = renderRootLayout(['search.panel.view', 'intelligence.crud.view']);

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);

    fireEvent.click(screen.getByRole('link', { name: /Arama/i }));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    fireEvent.click(screen.getByRole('link', { name: /Arama/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Arama #2 minimize et' }));

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: /stihbarat/i }));
    advanceHoverTimer(80);
    const manageLauncher = screen
      .getAllByTestId('workspace-window-launcher')
      .find((item) => item.getAttribute('data-menu-path') === '/intelligence/manage');
    fireEvent.click(manageLauncher!);

    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute('data-open-count', '3');
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-menu-path',
      '/intelligence/manage',
    );
    vi.useRealTimers();
    expect(
      await within(screen.getByTestId('workspace-window-active')).findByTestId(
        'intelligence-manage-page',
      ),
    ).toBeInTheDocument();

    view.unmount();
    renderRootLayout(['search.panel.view', 'intelligence.crud.view']);

    expect(screen.getByTestId('workspace-window-stack')).toHaveAttribute('data-open-count', '3');
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-menu-path',
      '/intelligence/manage',
    );
    expect(
      await within(screen.getByTestId('workspace-window-active')).findByTestId(
        'intelligence-manage-page',
      ),
    ).toBeInTheDocument();

    const taskbars = screen.getAllByTestId('workspace-taskbar');
    expect(taskbars).toHaveLength(2);
    expect(taskbars[0]).toHaveAttribute('data-open-count', '2');
    expect(within(taskbars[0]!).getByTestId('workspace-taskbar-label-base')).toHaveTextContent(
      'Arama',
    );
    expect(taskbars[1]).toHaveAttribute('data-open-count', '1');
    expect(within(taskbars[1]!).getByTestId('workspace-taskbar-label-base')).toHaveTextContent(
      'İstihbarat Yönet',
    );

    fireEvent.mouseEnter(taskbars[0]!);
    fireEvent.click(screen.getAllByTestId('workspace-taskbar-preview-card')[1]!);
    expect(screen.getByTestId('workspace-window-active')).toHaveAttribute(
      'data-window-title',
      'Arama #2',
    );
    expect(
      await within(screen.getByTestId('workspace-window-active')).findByTestId(
        'search-page-shell',
      ),
    ).toBeInTheDocument();
  });

  it('collapses and expands the left rail using the same pattern as the top video menu', () => {
    vi.useFakeTimers();
    renderRootLayout(['gis.map.view', 'search.panel.view', 'video.player.view']);

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: 'Harita' }));
    advanceHoverTimer(80);
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-open-tab', 'giris');

    fireEvent.click(screen.getByTestId('main-rail-collapse-toggle'));
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute('data-rail-state', 'collapsed');
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute(
      'data-collapsed-surface',
      'button-only',
    );
    expect(screen.queryByTestId('main-shell-tabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rail-flyout-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sol menüyü aç' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      screen.getByRole('button', { name: 'Sol menüyü aç' }).querySelector('svg'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Sol menüyü aç' }));
    expect(screen.getByTestId('main-shell-rail')).toHaveAttribute('data-rail-state', 'expanded');
    expect(screen.getByTestId('main-shell-tabs')).toBeInTheDocument();
  });

  it('opens a right flyout with hover intent and closes it on submenu, leave, or owning rail click', () => {
    vi.useFakeTimers();
    renderRootLayout(['gis.map.view', 'video.player.view']);

    expect(screen.queryByRole('link', { name: /3B Harita/i })).not.toBeInTheDocument();

    const railTabs = within(screen.getByTestId('main-shell-tabs'));
    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: 'Harita' }));
    advanceHoverTimer(79);
    expect(screen.queryByRole('link', { name: /3B Harita/i })).not.toBeInTheDocument();
    advanceHoverTimer(1);
    expect(screen.getByTestId('rail-flyout-panel')).toHaveAttribute('data-open-tab', 'giris');
    expect(screen.getByRole('link', { name: /3B Harita/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /3B Harita/i }));
    expect(screen.queryByRole('link', { name: /3B Harita/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(railTabs.getByRole('tab', { name: 'Harita' }));
    advanceHoverTimer(80);
    fireEvent.click(railTabs.getByRole('tab', { name: 'Harita' }));
    expect(screen.queryByRole('link', { name: /3B Harita/i })).not.toBeInTheDocument();
  });

  it('keeps video providers in a top-center map HUD menu with the same controls', () => {
    renderRootLayout(['video.player.view']);

    expect(screen.getByTestId('top-video-menu')).toHaveAttribute(
      'data-nav-style',
      'horizontal-tactical-video',
    );
    expect(screen.getByTestId('top-video-menu')).toHaveAttribute(
      'data-anchor',
      'top-center-map-hud',
    );
    expect(screen.getByTestId('top-video-menu')).toHaveAttribute(
      'data-expand-direction',
      'left',
    );
    expect(screen.queryByRole('link', { name: /ANKA-1/i })).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId('top-video-tabs')).getByRole('tab', { name: 'Ankas' }),
    );
    expect(screen.getByTestId('top-video-sources')).toBeInTheDocument();
    expect(screen.getByTestId('top-video-sources')).toHaveAttribute(
      'data-placement',
      'below-main-menu',
    );
    expect(screen.getByRole('link', { name: /ANKA-1 online/i })).toHaveAttribute(
      'href',
      '/video/ankas/1',
    );
    expect(screen.getByRole('link', { name: /ANKA-2 offline/i })).toHaveAttribute(
      'href',
      '/video/ankas/2',
    );
    expect(screen.getAllByTestId('video-status-dot')).toHaveLength(4);
    expect(screen.getAllByTestId('top-video-source')[0]).toHaveAttribute('data-status', 'online');
    expect(screen.getAllByTestId('top-video-source')[1]).toHaveAttribute('data-status', 'offline');

    fireEvent.click(screen.getByTestId('top-video-collapse-toggle'));
    expect(screen.getByTestId('top-video-menu')).toHaveAttribute('data-collapsed', 'true');
    expect(screen.queryByTestId('top-video-tabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('top-video-sources')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'İHA menüsünü aç' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(
      screen.getByRole('button', { name: 'İHA menüsünü aç' }).querySelector('svg'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'İHA menüsünü aç' }));
    expect(screen.getByTestId('top-video-menu')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByTestId('top-video-tabs')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId('top-video-tabs')).getByRole('tab', { name: 'Ankas' }),
    );
    fireEvent.click(screen.getByRole('link', { name: /ANKA-1 online/i }));
    expect(screen.queryByRole('link', { name: /ANKA-1/i })).not.toBeInTheDocument();
  });
});
