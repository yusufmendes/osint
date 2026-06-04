import { Suspense, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import LogoutIcon from '@mui/icons-material/Logout';
import MinimizeIcon from '@mui/icons-material/Minimize';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link, Outlet } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import type { ModuleRibbonItem, ModuleRoute, RibbonTabId } from 'isr-web-core';
import { useCurrentUser } from 'isr-web-core';
import { shellConfig } from '../config';
import { allModules } from '../router/manifest';
import { shellActions } from '../store/shellSlice';

const RIBBON_TABS: { id: RibbonTabId; label: string }[] = [
  { id: 'giris', label: 'Harita' },
  { id: 'araclar', label: 'İstihbarat' },
  { id: 'ankas', label: 'Ankas' },
  { id: 'baykar', label: 'Baykar' },
  { id: 'gozcu', label: 'Gözcü' },
];
const VIDEO_TAB_IDS = new Set<RibbonTabId>(['ankas', 'baykar', 'gozcu']);

const HOVER_OPEN_DELAY_MS = 80;
const HOVER_CLOSE_DELAY_MS = 120;
const TASKBAR_PREVIEW_CLOSE_DELAY_MS = 180;
const RAIL_FLYOUT_TAB_STEP_PX = 80;
const WORKSPACE_SESSION_STORAGE_KEY = 'isr.workspace.v1';
const WORKSPACE_SESSION_STORAGE_VERSION = 1;
const MENU_FIXED_RADIAL_BACKGROUND = `
  radial-gradient(ellipse 64px 118px at 50% 0px, rgba(126, 227, 255, 0.18) 0%, rgba(126, 227, 255, 0.1) 34%, transparent 70%),
  linear-gradient(180deg, rgba(23, 42, 50, 0.64), rgba(5, 13, 18, 0.54))
`;

function sortRibbonItems(a: ModuleRibbonItem, b: ModuleRibbonItem) {
  return a.order - b.order || a.label.localeCompare(b.label, 'tr');
}

function RailTabGlyph({ id }: { id: RibbonTabId }) {
  switch (id) {
    case 'giris':
      return (
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M5 8.5 11.2 5l6 3.5 5.8-3.2v15.2l-5.8 3.2-6-3.5L5 23.5Z" />
          <path d="M11.2 5v15.2M17.2 8.5v15.2" />
          <path d="M8.2 15.8h11.6M14 11.2l2.2 2.2L14 15.6l-2.2-2.2Z" />
        </svg>
      );
    case 'araclar':
      return (
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M14 4.5 22.2 9v10L14 23.5 5.8 19V9Z" />
          <path d="M14 8v12M8.8 11l10.4 6M19.2 11 8.8 17" />
          <path d="M14 12.2 16 14l-2 1.8L12 14Z" />
        </svg>
      );
    case 'ankas':
      return (
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M3.8 16.6 13.2 8l10.8 4.2-8.2 2.9 5.2 5.1-7.4-2.3-4.8 3.9 1.5-5.6Z" />
          <path d="M13.2 8 15.8 15.1M8.8 21.8l4.8-3.9" />
        </svg>
      );
    case 'baykar':
      return (
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M4 15.2 13.8 12l10.2 3.2-10.2 2.4Z" />
          <path d="M13.8 6.2v15.6M8.6 18.6l-2.2 3M19 18.4l2.6 2.9" />
          <path d="M12.2 10.2h3.2M12.2 19.4h3.2" />
        </svg>
      );
    case 'gozcu':
      return (
        <svg viewBox="0 0 68 28" aria-hidden="true">
          <path d="M4 14.6 17.5 12.5 42.5 12.2 62.5 15.2 42.5 17.8 17.5 17.2Z" />
          <path d="M24.5 12.4 37.5 5.8 42 6.8 33.5 12.5" />
          <path d="M24.5 17.1 37.5 23.5 42 22.5 33.5 17.4" />
          <path d="M49.5 13.3 59 8.6M49.5 16.5 59 21.2" />
          <path d="M9 14.6 5 11.5M9 14.8 5 18" />
          <circle cx="20.8" cy="14.8" r="1.2" />
          <circle cx="45.2" cy="15.1" r="1.2" />
        </svg>
      );
    default:
      return null;
  }
}

type WorkspaceWindowStatus = 'maximized' | 'minimized';

type WorkspaceWindowInstance = {
  id: number;
  menuPath: string;
  label: string;
  title: string;
  status: WorkspaceWindowStatus;
  createdAt: string;
  previewMeta: string;
  icon: ReactNode;
  content: ReactNode;
};

type WorkspaceTaskbarGroup = {
  menuPath: string;
  label: string;
  icon: ReactNode;
  windows: WorkspaceWindowInstance[];
};

type PersistedWorkspaceWindow = {
  id: number;
  menuPath: string;
  title: string;
  status: WorkspaceWindowStatus;
  createdAt: string;
};

type PersistedWorkspaceState = {
  version: typeof WORKSPACE_SESSION_STORAGE_VERSION;
  nextWindowId: number;
  activeWindowId: number | null;
  windows: PersistedWorkspaceWindow[];
};

function isWorkspaceWindowItem(item: ModuleRibbonItem) {
  return Boolean(item.workspace);
}

function isWorkspaceWindowStatus(value: unknown): value is WorkspaceWindowStatus {
  return value === 'maximized' || value === 'minimized';
}

function readPersistedWorkspaceState(): PersistedWorkspaceState | null {
  try {
    const rawState = window.sessionStorage.getItem(WORKSPACE_SESSION_STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState) as Partial<PersistedWorkspaceState>;

    if (
      parsedState.version !== WORKSPACE_SESSION_STORAGE_VERSION ||
      !Array.isArray(parsedState.windows)
    ) {
      window.sessionStorage.removeItem(WORKSPACE_SESSION_STORAGE_KEY);
      return null;
    }

    const windows = parsedState.windows.filter(
      (windowState): windowState is PersistedWorkspaceWindow =>
        Number.isInteger(windowState?.id) &&
        typeof windowState?.menuPath === 'string' &&
        typeof windowState?.title === 'string' &&
        typeof windowState?.createdAt === 'string' &&
        isWorkspaceWindowStatus(windowState?.status),
    );

    return {
      version: WORKSPACE_SESSION_STORAGE_VERSION,
      nextWindowId: Number.isInteger(parsedState.nextWindowId)
        ? parsedState.nextWindowId!
        : windows.reduce((maxId, windowState) => Math.max(maxId, windowState.id), 0) + 1,
      activeWindowId:
        parsedState.activeWindowId === null || Number.isInteger(parsedState.activeWindowId)
          ? (parsedState.activeWindowId ?? null)
          : null,
      windows,
    };
  } catch {
    window.sessionStorage.removeItem(WORKSPACE_SESSION_STORAGE_KEY);
    return null;
  }
}

function writePersistedWorkspaceState(
  windows: WorkspaceWindowInstance[],
  activeWindowId: number | null,
  nextWindowId: number,
) {
  try {
    if (windows.length === 0) {
      window.sessionStorage.removeItem(WORKSPACE_SESSION_STORAGE_KEY);
      return;
    }

    const state: PersistedWorkspaceState = {
      version: WORKSPACE_SESSION_STORAGE_VERSION,
      nextWindowId,
      activeWindowId,
      windows: windows.map(({ id, menuPath, title, status, createdAt }) => ({
        id,
        menuPath,
        title,
        status,
        createdAt,
      })),
    };

    window.sessionStorage.setItem(WORKSPACE_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage can be unavailable in restricted browser contexts */
  }
}

function removePersistedWorkspaceState() {
  try {
    window.sessionStorage.removeItem(WORKSPACE_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function hydrateWorkspaceWindow(
  persistedWindow: PersistedWorkspaceWindow,
  item: ModuleRibbonItem,
  route: ModuleRoute,
): WorkspaceWindowInstance {
  return {
    id: persistedWindow.id,
    menuPath: item.path,
    label: item.label,
    title: persistedWindow.title,
    status: persistedWindow.status,
    createdAt: persistedWindow.createdAt,
    previewMeta: item.group,
    icon: item.icon,
    content: route.element,
  };
}

function WorkspaceWindow({
  workspace,
  isActive,
  onActivate,
  onMinimize,
  onMaximize,
  onClose,
}: {
  workspace: WorkspaceWindowInstance;
  isActive: boolean;
  onActivate: (id: number) => void;
  onMinimize: (id: number) => void;
  onMaximize: (id: number) => void;
  onClose: (id: number) => void;
}) {
  return (
    <Box
      data-testid={isActive ? 'workspace-window-active' : 'workspace-window'}
      data-window-id={workspace.id}
      data-window-title={workspace.title}
      data-menu-path={workspace.menuPath}
      data-window-state={workspace.status}
      sx={{
        position: 'fixed',
        top: { xs: 10, md: 18 },
        right: { xs: 10, md: 18 },
        bottom: { xs: 10, md: 18 },
        left: { xs: 72, md: 84 },
        zIndex: isActive ? 39 : 34,
        display: 'grid',
        gridTemplateRows: '54px 1fr',
        overflow: 'hidden',
        color: '#e7f6f8',
        borderRadius: 2,
        bgcolor: 'rgba(8, 18, 23, 0.76)',
        backgroundImage: `
          radial-gradient(ellipse 420px 280px at 0px 0px, rgba(126, 227, 255, 0.18), transparent 72%),
          linear-gradient(135deg, rgba(23, 42, 50, 0.78), rgba(5, 13, 18, 0.72))
        `,
        border: '1px solid rgba(126, 227, 255, 0.22)',
        boxShadow:
          '18px 24px 48px rgba(0,0,0,0.44), inset 1px 1px 2px rgba(255,255,255,0.06), inset -6px -7px 16px rgba(0,0,0,0.42)',
        backdropFilter: 'blur(16px) saturate(1.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.6,
          borderBottom: '1px solid rgba(126, 227, 255, 0.18)',
          backgroundImage:
            'linear-gradient(90deg, rgba(126, 227, 255, 0.14), rgba(126, 227, 255, 0.025))',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 22,
            height: 22,
            display: 'grid',
            placeItems: 'center',
            color: '#7ee3ff',
            '& svg': { width: 21, height: 21, overflow: 'visible' },
            '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon': {
              stroke: 'currentColor',
              fill: 'none',
              strokeWidth: 1.55,
              strokeLinecap: 'square',
              strokeLinejoin: 'miter',
              vectorEffect: 'non-scaling-stroke',
            },
          }}
        >
          {workspace.icon}
        </Box>
        <Typography sx={{ color: '#f2fbff', fontSize: 16, fontWeight: 950 }}>
          {workspace.title}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(220, 238, 243, 0.58)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {workspace.createdAt}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box
          component="button"
          type="button"
          aria-label={`${workspace.title} minimize et`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onMinimize(workspace.id);
          }}
          sx={workspaceWindowButtonSx}
        >
          <MinimizeIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box
          component="button"
          type="button"
          aria-label={`${workspace.title} maksimize et`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onActivate(workspace.id);
            onMaximize(workspace.id);
          }}
          sx={workspaceWindowButtonSx}
        >
          <CropSquareIcon sx={{ fontSize: 15 }} />
        </Box>
        <Box
          component="button"
          type="button"
          aria-label={`${workspace.title} kapat`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onClose(workspace.id);
          }}
          sx={workspaceWindowButtonSx}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          overflow: 'auto',
          bgcolor: 'rgba(5, 13, 18, 0.24)',
          '& [data-testid="search-page-shell"], & [data-testid="intelligence-create-page"], & [data-testid="intelligence-manage-page"]':
            {
              minHeight: '100%',
              bgcolor: 'transparent',
            },
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'rgba(220, 238, 243, 0.62)',
                fontSize: 13,
                fontWeight: 850,
              }}
            >
              Yükleniyor
            </Box>
          }
        >
          {workspace.content}
        </Suspense>
      </Box>
    </Box>
  );
}

function WorkspaceTaskbar({
  workspaces,
  icon,
  label,
  previewOpen,
  onPreviewOpenChange,
  onMaximize,
  onClose,
  offsetIndex = 0,
  groupCount = 1,
}: {
  workspaces: WorkspaceWindowInstance[];
  icon: ReactNode;
  label: string;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
  onMaximize: (id: number) => void;
  onClose: (id: number) => void;
  offsetIndex?: number;
  groupCount?: number;
}) {
  const minimizedCount = workspaces.filter((workspace) => workspace.status === 'minimized').length;
  const xOffset = (offsetIndex - (groupCount - 1) / 2) * 104;
  const labelBaseWidth = Math.min(138, Math.max(92, label.length * 6 + 24));
  const taskbarButtonWidth = Math.max(98, labelBaseWidth + 6);
  const previewCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTaskbarPreviewCloseTimer = () => {
    if (previewCloseTimerRef.current) {
      clearTimeout(previewCloseTimerRef.current);
      previewCloseTimerRef.current = null;
    }
  };

  const openTaskbarPreview = () => {
    clearTaskbarPreviewCloseTimer();
    onPreviewOpenChange(true);
  };

  const scheduleTaskbarPreviewClose = () => {
    clearTaskbarPreviewCloseTimer();
    previewCloseTimerRef.current = setTimeout(() => {
      onPreviewOpenChange(false);
      previewCloseTimerRef.current = null;
    }, TASKBAR_PREVIEW_CLOSE_DELAY_MS);
  };

  useEffect(
    () => () => {
      clearTaskbarPreviewCloseTimer();
    },
    [],
  );

  return (
    <Box
      data-testid="workspace-taskbar"
      data-outer-surface="none"
      data-open-count={workspaces.length}
      data-minimized-count={minimizedCount}
      data-preview-close-delay-ms={TASKBAR_PREVIEW_CLOSE_DELAY_MS}
      onMouseEnter={openTaskbarPreview}
      onMouseLeave={scheduleTaskbarPreviewClose}
      onFocus={openTaskbarPreview}
      onBlur={(event) => {
        const nextFocus = event.relatedTarget;
        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
          scheduleTaskbarPreviewClose();
        }
      }}
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: { xs: 10, md: 16 },
        transform: `translateX(calc(-50% + ${xOffset}px))`,
        zIndex: 43,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
        color: '#e7f6f8',
        borderRadius: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        border: 0,
        boxShadow: 'none',
        backdropFilter: 'none',
        '& svg': {
          width: 25,
          height: 25,
          overflow: 'visible',
          filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.18))',
        },
        '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon': {
          stroke: 'currentColor',
          fill: 'none',
          strokeWidth: 1.55,
          strokeLinecap: 'square',
          strokeLinejoin: 'miter',
          vectorEffect: 'non-scaling-stroke',
        },
      }}
    >
      {previewOpen && (
        <Box
          data-testid="workspace-taskbar-preview"
          data-preview-count={workspaces.length}
          data-layout="horizontal-thumbnail-row"
          onMouseEnter={openTaskbarPreview}
          onMouseLeave={scheduleTaskbarPreviewClose}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 10px)',
            transform: 'translateX(-50%)',
            width: 'max-content',
            maxWidth: { xs: 'calc(100vw - 24px)', md: 'calc(100vw - 180px)' },
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0.75,
            p: 0.85,
            borderRadius: 2,
            bgcolor: 'rgba(8, 18, 23, 0.76)',
            backgroundImage: `
              radial-gradient(ellipse 220px 150px at 50% 0%, rgba(126, 227, 255, 0.16), transparent 74%),
              linear-gradient(135deg, rgba(23, 42, 50, 0.72), rgba(5, 13, 18, 0.64))
            `,
            border: '1px solid rgba(126, 227, 255, 0.2)',
            boxShadow:
              '14px 18px 34px rgba(0,0,0,0.34), inset 1px 1px 2px rgba(255,255,255,0.05), inset -5px -6px 14px rgba(0,0,0,0.36)',
            backdropFilter: 'blur(14px) saturate(1.05)',
            overflowX: 'auto',
          }}
        >
          {workspaces.map((workspace) => (
            <Box
              key={workspace.id}
              data-testid="workspace-taskbar-preview-card"
              data-menu-path={workspace.menuPath}
              data-window-state={workspace.status}
              data-preview-shape="square"
              role="button"
              tabIndex={0}
              aria-label={`${workspace.title} maksimize et`}
              onClick={() => onMaximize(workspace.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onMaximize(workspace.id);
                }
              }}
              sx={{
                position: 'relative',
                display: 'grid',
                gridTemplateRows: '1fr',
                alignItems: 'stretch',
                width: 164,
                minWidth: 164,
                height: 164,
                borderRadius: 1.3,
                bgcolor:
                  workspace.status === 'minimized'
                    ? 'rgba(5, 13, 18, 0.54)'
                    : 'rgba(126, 227, 255, 0.08)',
                border: `1px solid ${
                  workspace.status === 'minimized'
                    ? 'rgba(126, 227, 255, 0.12)'
                    : 'rgba(126, 227, 255, 0.28)'
                }`,
                cursor: 'pointer',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(126, 227, 255, 0.12)',
                  borderColor: 'rgba(126, 227, 255, 0.38)',
                },
                '&:focus-visible': {
                  outline: '2px solid rgba(126, 227, 255, 0.78)',
                  outlineOffset: 3,
                },
              }}
            >
              <Box
                sx={{
                  p: 0.8,
                  height: '100%',
                  display: 'grid',
                  gridTemplateRows: '94px 1fr',
                  gap: 0.7,
                  alignItems: 'stretch',
                  color: 'inherit',
                  bgcolor: 'transparent',
                  textAlign: 'left',
                  font: 'inherit',
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    height: '100%',
                    borderRadius: 1,
                    bgcolor: 'rgba(5, 13, 18, 0.48)',
                    backgroundImage: `
                      linear-gradient(90deg, rgba(240, 210, 71, 0.2) 1px, transparent 1px),
                      linear-gradient(0deg, rgba(126, 227, 255, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: '18px 18px',
                    border: '1px solid rgba(126, 227, 255, 0.12)',
                    boxShadow:
                      'inset 1px 1px 2px rgba(255,255,255,0.03), inset -3px -4px 10px rgba(0,0,0,0.28)',
                  }}
                />
                <Box sx={{ minWidth: 0, display: 'grid', alignContent: 'center', gap: 0.2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <Typography sx={{ color: '#f2fbff', fontSize: 13, fontWeight: 950 }}>
                      {workspace.title}
                    </Typography>
                    <Typography
                      sx={{
                        ml: 'auto',
                        color: workspace.status === 'minimized' ? '#f0d247' : '#7ee3ff',
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {workspace.status === 'minimized' ? 'MIN' : 'AÇIK'}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(220, 238, 243, 0.56)', fontSize: 11 }}>
                    {workspace.previewMeta} · {workspace.createdAt}
                  </Typography>
                </Box>
              </Box>
              <Box
                component="button"
                type="button"
                aria-label={`${workspace.title} kapat`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(workspace.id);
                }}
                sx={{
                  appearance: 'none',
                  cursor: 'pointer',
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 24,
                  height: 24,
                  border: '1px solid rgba(126, 227, 255, 0.16)',
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'rgba(220, 238, 243, 0.78)',
                  bgcolor: 'rgba(5, 13, 18, 0.58)',
                  '&:hover': { color: '#f2fbff', bgcolor: 'rgba(126, 227, 255, 0.1)' },
                  '&:focus-visible': {
                    outline: '2px solid rgba(126, 227, 255, 0.78)',
                    outlineOffset: 2,
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box
        data-testid="workspace-taskbar-button"
        data-interaction="preview-only"
        role="group"
        tabIndex={0}
        aria-label={`${label} pencereleri`}
        onMouseEnter={openTaskbarPreview}
        onFocus={openTaskbarPreview}
        onClick={openTaskbarPreview}
        sx={{
          position: 'relative',
          minWidth: 0,
          width: taskbarButtonWidth,
          height: 82,
          p: 0,
          display: 'grid',
          gridTemplateRows: '58px 24px',
          justifyItems: 'center',
          alignItems: 'center',
          overflow: 'visible',
          borderRadius: 2,
          color: '#7ee3ff',
          bgcolor: 'transparent',
          border: 0,
          boxShadow: 'none',
          cursor: 'default',
          '&:hover': {
            color: '#f2fbff',
          },
          '&:hover [data-testid="workspace-taskbar-icon"]': {
            bgcolor: 'rgba(126, 227, 255, 0.1)',
            borderColor: 'rgba(126, 227, 255, 0.44)',
            boxShadow:
              '0 0 24px rgba(126, 227, 255, 0.2), inset 1px 1px 2px rgba(255,255,255,0.06), inset -3px -4px 10px rgba(0,0,0,0.34)',
          },
          '&:hover [data-testid="workspace-taskbar-label-base"]': {
            color: '#f2fbff',
            borderColor: 'rgba(126, 227, 255, 0.42)',
          },
          '&:focus-visible': {
            outline: '2px solid rgba(126, 227, 255, 0.78)',
            outlineOffset: 3,
          },
        }}
      >
        <Box
          data-testid="workspace-taskbar-icon"
          sx={{
            width: 54,
            height: 54,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 999,
            color: 'inherit',
            bgcolor: 'rgba(8, 18, 23, 0.34)',
            border: '1px solid rgba(126, 227, 255, 0.24)',
            boxShadow:
              '0 0 22px rgba(126, 227, 255, 0.12), inset 1px 1px 2px rgba(255,255,255,0.05), inset -3px -4px 10px rgba(0,0,0,0.34)',
            transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
          }}
        >
          {icon}
        </Box>
        <Box
          data-testid="workspace-taskbar-label-base"
          data-label-source="menu"
          component="span"
          sx={{
            width: labelBaseWidth,
            height: 24,
            mt: -0.5,
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(220, 238, 243, 0.9)',
            bgcolor: 'rgba(8, 18, 23, 0.5)',
            backgroundImage: `
              radial-gradient(ellipse at 50% 0%, rgba(126, 227, 255, 0.14), transparent 60%),
              linear-gradient(180deg, rgba(23, 42, 50, 0.66), rgba(5, 13, 18, 0.46))
            `,
            border: '1px solid rgba(126, 227, 255, 0.24)',
            borderTopColor: 'rgba(126, 227, 255, 0.36)',
            clipPath: 'polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)',
            boxShadow:
              '0 10px 18px rgba(0,0,0,0.22), inset 0 -5px 10px rgba(126, 227, 255, 0.025)',
            fontSize: 10,
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: 0,
            textAlign: 'center',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 120ms ease, border-color 120ms ease',
          }}
        >
          {label}
        </Box>
        <Box
          data-testid="workspace-taskbar-badge"
          sx={{
            position: 'absolute',
            top: 0,
            right: (taskbarButtonWidth - 54) / 2 + 2,
            minWidth: 20,
            height: 20,
            px: 0.45,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 999,
            color: '#061014',
            bgcolor: '#f0d247',
            border: '1px solid rgba(5, 13, 18, 0.8)',
            boxShadow: '0 0 12px rgba(240, 210, 71, 0.24)',
            fontSize: 11,
            fontWeight: 950,
            lineHeight: 1,
          }}
        >
          {workspaces.length}
        </Box>
      </Box>
    </Box>
  );
}

const workspaceWindowButtonSx = {
  appearance: 'none',
  cursor: 'pointer',
  minWidth: 0,
  width: 34,
  height: 34,
  p: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#7ee3ff',
  borderRadius: 999,
  border: '1px solid rgba(126, 227, 255, 0.18)',
  bgcolor: 'rgba(5, 13, 18, 0.28)',
  '&:hover': {
    color: '#f2fbff',
    bgcolor: 'rgba(126, 227, 255, 0.1)',
    borderColor: 'rgba(126, 227, 255, 0.34)',
  },
  '&:focus-visible': {
    outline: '2px solid rgba(126, 227, 255, 0.78)',
    outlineOffset: 2,
  },
};

export function RootLayout() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, hasPermission } = useCurrentUser();
  const [openTab, setOpenTab] = useState<RibbonTabId | null>(null);
  const [openVideoTab, setOpenVideoTab] = useState<RibbonTabId | null>(null);
  const [railMenuCollapsed, setRailMenuCollapsed] = useState(false);
  const [videoMenuCollapsed, setVideoMenuCollapsed] = useState(false);
  const [workspaceWindows, setWorkspaceWindows] = useState<WorkspaceWindowInstance[]>([]);
  const [activeWorkspaceWindowId, setActiveWorkspaceWindowId] = useState<number | null>(null);
  const [taskbarPreviewMenuPath, setTaskbarPreviewMenuPath] = useState<string | null>(null);
  const [workspacePersistenceReady, setWorkspacePersistenceReady] = useState(false);
  const workspaceWindowSequenceRef = useRef(1);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleRibbon = useMemo(
    () =>
      allModules
        .flatMap((m) => m.ribbon)
        .filter((item) => item.permissions.every(hasPermission))
        .sort(sortRibbonItems),
    [hasPermission],
  );

  const visibleTabs = RIBBON_TABS.filter(
    (tab) => !VIDEO_TAB_IDS.has(tab.id) && visibleRibbon.some((item) => item.tab === tab.id),
  );
  const visibleVideoTabs = RIBBON_TABS.filter(
    (tab) => VIDEO_TAB_IDS.has(tab.id) && visibleRibbon.some((item) => item.tab === tab.id),
  );
  const selectedTab = visibleTabs.some((tab) => tab.id === openTab) ? openTab : null;
  const selectedVideoTab = visibleVideoTabs.some((tab) => tab.id === openVideoTab)
    ? openVideoTab
    : null;
  const selectedTabIndex = selectedTab
    ? Math.max(
        0,
        visibleTabs.findIndex((tab) => tab.id === selectedTab),
      )
    : 0;
  const activeItems = selectedTab ? visibleRibbon.filter((item) => item.tab === selectedTab) : [];
  const activeVideoItems = selectedVideoTab
    ? visibleRibbon.filter((item) => item.tab === selectedVideoTab)
    : [];
  const routesByPath = useMemo(
    () => new Map(allModules.flatMap((module) => module.routes.map((route) => [route.path, route]))),
    [],
  );
  const workspaceItemsByPath = useMemo(
    () =>
      new Map(
        visibleRibbon
          .filter(isWorkspaceWindowItem)
          .map((item) => [item.path, item]),
      ),
    [visibleRibbon],
  );
  const workspaceTaskbarGroups = useMemo<WorkspaceTaskbarGroup[]>(() => {
    const groups = new Map<string, WorkspaceTaskbarGroup>();

    workspaceWindows.forEach((workspace) => {
      const existingGroup = groups.get(workspace.menuPath);
      if (existingGroup) {
        existingGroup.windows.push(workspace);
        return;
      }

      groups.set(workspace.menuPath, {
        menuPath: workspace.menuPath,
        label: workspace.label,
        icon: workspace.icon,
        windows: [workspace],
      });
    });

    return [...groups.values()];
  }, [workspaceWindows]);
  const flyoutAnchorTop = {
    xs: 152 + selectedTabIndex * RAIL_FLYOUT_TAB_STEP_PX,
    md: 158 + selectedTabIndex * RAIL_FLYOUT_TAB_STEP_PX,
  };

  const clearOpenTimer = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openRibbonTab = (tabId: RibbonTabId, delay = HOVER_OPEN_DELAY_MS) => {
    clearOpenTimer();
    clearCloseTimer();
    if (delay === 0) {
      setOpenTab(tabId);
      return;
    }
    openTimerRef.current = setTimeout(() => {
      setOpenTab(tabId);
      openTimerRef.current = null;
    }, delay);
  };

  const closeRibbonTab = (delay = HOVER_CLOSE_DELAY_MS) => {
    clearOpenTimer();
    clearCloseTimer();
    if (delay === 0) {
      setOpenTab(null);
      return;
    }
    closeTimerRef.current = setTimeout(() => {
      setOpenTab(null);
      closeTimerRef.current = null;
    }, delay);
  };

  const toggleRibbonTab = (tabId: RibbonTabId) => {
    clearOpenTimer();
    clearCloseTimer();
    setOpenTab((current) => (current === tabId ? null : tabId));
  };

  const toggleVideoTab = (tabId: RibbonTabId) => {
    setOpenVideoTab((current) => (current === tabId ? null : tabId));
  };

  const toggleRailMenuCollapsed = () => {
    if (!railMenuCollapsed) {
      closeRibbonTab(0);
    }
    setRailMenuCollapsed((current) => !current);
  };

  const toggleVideoMenuCollapsed = () => {
    setVideoMenuCollapsed((current) => {
      const next = !current;
      if (next) {
        setOpenVideoTab(null);
      }
      return next;
    });
  };

  const openWorkspaceWindow = (item: ModuleRibbonItem) => {
    const workspaceConfig = item.workspace;
    const route = routesByPath.get(item.path);

    if (!workspaceConfig || !route) {
      closeRibbonTab(0);
      return;
    }

    const existingSingleWindow =
      workspaceConfig.mode === 'single'
        ? workspaceWindows.find((workspace) => workspace.menuPath === item.path)
        : undefined;

    if (existingSingleWindow) {
      activateWorkspaceWindow(existingSingleWindow.id);
      closeRibbonTab(0);
      return;
    }

    const id = workspaceWindowSequenceRef.current;
    workspaceWindowSequenceRef.current += 1;
    const instanceNumber =
      workspaceWindows.filter((workspace) => workspace.menuPath === item.path).length + 1;
    const createdAt = new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    const title =
      workspaceConfig.title ??
      (workspaceConfig.mode === 'multi' ? `${item.label} #${instanceNumber}` : item.label);

    setWorkspaceWindows((current) => [
      ...current,
      {
        id,
        menuPath: item.path,
        label: item.label,
        title,
        status: 'maximized',
        createdAt,
        previewMeta: item.group,
        icon: item.icon,
        content: route.element,
      },
    ]);
    setActiveWorkspaceWindowId(id);
    setTaskbarPreviewMenuPath(null);
    closeRibbonTab(0);
  };

  const activateWorkspaceWindow = (id: number) => {
    setWorkspaceWindows((current) =>
      current.map((workspace) =>
        workspace.id === id ? { ...workspace, status: 'maximized' as const } : workspace,
      ),
    );
    setActiveWorkspaceWindowId(id);
    setTaskbarPreviewMenuPath(null);
  };

  const minimizeWorkspaceWindow = (id: number) => {
    setWorkspaceWindows((current) => {
      const next = current.map((workspace) =>
        workspace.id === id ? { ...workspace, status: 'minimized' as const } : workspace,
      );
      const nextActiveId = [...next].reverse().find((workspace) => workspace.status === 'maximized')
        ?.id;
      setActiveWorkspaceWindowId((currentActive) =>
        currentActive === id ? (nextActiveId ?? null) : currentActive,
      );
      return next;
    });
  };

  const closeWorkspaceWindow = (id: number) => {
    setWorkspaceWindows((current) => {
      const next = current.filter((workspace) => workspace.id !== id);
      const nextActiveId = [...next].reverse().find((workspace) => workspace.status === 'maximized')
        ?.id;
      setActiveWorkspaceWindowId((currentActive) =>
        currentActive === id ? (nextActiveId ?? null) : currentActive,
      );
      return next;
    });
  };

  useEffect(() => {
    if (!isAuthenticated || workspacePersistenceReady) {
      return;
    }

    const persistedState = readPersistedWorkspaceState();

    if (!persistedState) {
      setWorkspacePersistenceReady(true);
      return;
    }

    const seenSingleWindowPaths = new Set<string>();
    const restoredWindows = persistedState.windows.reduce<WorkspaceWindowInstance[]>(
      (windows, persistedWindow) => {
        const item = workspaceItemsByPath.get(persistedWindow.menuPath);
        const route = routesByPath.get(persistedWindow.menuPath);

        if (!item?.workspace || !route) {
          return windows;
        }

        if (item.workspace.mode === 'single') {
          if (seenSingleWindowPaths.has(item.path)) {
            return windows;
          }
          seenSingleWindowPaths.add(item.path);
        }

        windows.push(hydrateWorkspaceWindow(persistedWindow, item, route));
        return windows;
      },
      [],
    );
    const maxRestoredId = restoredWindows.reduce(
      (maxId, workspace) => Math.max(maxId, workspace.id),
      0,
    );
    const restoredActiveWindowId = restoredWindows.some(
      (workspace) =>
        workspace.id === persistedState.activeWindowId && workspace.status === 'maximized',
    )
      ? persistedState.activeWindowId
      : ([...restoredWindows].reverse().find((workspace) => workspace.status === 'maximized')?.id ??
        null);

    workspaceWindowSequenceRef.current = Math.max(
      workspaceWindowSequenceRef.current,
      persistedState.nextWindowId,
      maxRestoredId + 1,
    );
    setWorkspaceWindows(restoredWindows);
    setActiveWorkspaceWindowId(restoredActiveWindowId);
    setWorkspacePersistenceReady(true);
  }, [
    isAuthenticated,
    routesByPath,
    workspaceItemsByPath,
    workspacePersistenceReady,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !workspacePersistenceReady) {
      return;
    }

    writePersistedWorkspaceState(
      workspaceWindows,
      activeWorkspaceWindowId,
      workspaceWindowSequenceRef.current,
    );
  }, [activeWorkspaceWindowId, isAuthenticated, workspacePersistenceReady, workspaceWindows]);

  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [],
  );

  const onLogout = () => {
    try {
      localStorage.removeItem(shellConfig.jwtStorageKey);
    } catch {
      /* ignore */
    }
    removePersistedWorkspaceState();
    dispatch(shellActions.logout());
    window.location.assign('/login');
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a1419',
        color: '#dceef3',
        position: 'relative',
      }}
    >
      <Box
        data-testid="main-shell-rail"
        data-nav-style="tactical-command-rail"
        data-radial-model="fixed-menu-light"
        data-radial-size="64x118"
        data-height-policy="content-fit"
        data-rail-state={railMenuCollapsed ? 'collapsed' : 'expanded'}
        data-collapsed-surface={railMenuCollapsed ? 'button-only' : undefined}
        data-hover-intent={`${HOVER_OPEN_DELAY_MS}-${HOVER_CLOSE_DELAY_MS}`}
        component="nav"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={() => closeRibbonTab()}
        sx={{
          position: 'fixed',
          left: { xs: 8, md: 14 },
          top: { xs: 10, md: 16 },
          bottom: 'auto',
          zIndex: 40,
          width: railMenuCollapsed ? 54 : 66,
          height: 'fit-content',
          minHeight: railMenuCollapsed ? 36 : 'auto',
          maxHeight: { xs: 'calc(100vh - 20px)', md: 'calc(100vh - 32px)' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: railMenuCollapsed ? 0 : 1,
          px: railMenuCollapsed ? 0 : 0.7,
          py: railMenuCollapsed ? 0 : 0.9,
          borderRadius: 999,
          bgcolor: railMenuCollapsed ? 'transparent' : 'rgba(8, 18, 23, 0.56)',
          backgroundImage: railMenuCollapsed
            ? 'none'
            : MENU_FIXED_RADIAL_BACKGROUND,
          border: railMenuCollapsed ? 0 : '1px solid rgba(126, 227, 255, 0.16)',
          boxShadow: railMenuCollapsed
            ? 'none'
            : '14px 18px 34px rgba(0,0,0,0.32), inset 1px 1px 2px rgba(255,255,255,0.045), inset -4px -5px 12px rgba(0,0,0,0.34)',
          backdropFilter: railMenuCollapsed ? 'none' : 'blur(14px) saturate(1.05)',
        }}
      >
        <Button
          data-testid="main-rail-collapse-toggle"
          data-placement="top-left"
          aria-label={railMenuCollapsed ? 'Sol menüyü aç' : 'Sol menüyü kapat'}
          aria-expanded={!railMenuCollapsed}
          onClick={toggleRailMenuCollapsed}
          sx={{
            alignSelf: railMenuCollapsed ? 'center' : 'flex-start',
            minWidth: 0,
            width: railMenuCollapsed ? 54 : 36,
            height: 36,
            borderRadius: 999,
            p: 0,
            display: 'grid',
            gridTemplateColumns: railMenuCollapsed ? '24px 12px' : '1fr',
            placeItems: 'center',
            columnGap: 0.25,
            color: '#7ee3ff',
            bgcolor: 'rgba(8, 18, 23, 0.56)',
            border: '1px solid rgba(126, 227, 255, 0.2)',
            boxShadow:
              'inset 1px 1px 2px rgba(255,255,255,0.05), inset -3px -4px 7px rgba(0,0,0,0.34), 0 10px 20px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(12px)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 16,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: 'none',
            '& svg': {
              width: 24,
              height: 18,
              overflow: 'visible',
              filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.14))',
            },
            '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon': {
              stroke: 'currentColor',
              fill: 'none',
              strokeWidth: 1.55,
              strokeLinecap: 'square',
              strokeLinejoin: 'miter',
              vectorEffect: 'non-scaling-stroke',
            },
            '&:hover': {
              color: '#f2fbff',
              bgcolor: 'rgba(126, 227, 255, 0.1)',
              borderColor: 'rgba(126, 227, 255, 0.34)',
            },
            '&:focus-visible': {
              outline: '2px solid rgba(126, 227, 255, 0.78)',
              outlineOffset: 2,
            },
          }}
        >
          {railMenuCollapsed ? (
            <>
              <RailTabGlyph id="giris" />
              <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>
                &gt;
              </Box>
            </>
          ) : (
            '<'
          )}
        </Button>

        {!railMenuCollapsed && (
          <>
            <Box
              sx={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: '#f0d247',
                border: '1px solid rgba(240, 210, 71, 0.34)',
                bgcolor: 'rgba(5, 13, 18, 0.38)',
                boxShadow:
                  '0 0 18px rgba(240, 210, 71, 0.08), inset 0 0 14px rgba(240, 210, 71, 0.035)',
                fontWeight: 950,
                fontSize: 12,
                letterSpacing: 0,
              }}
              aria-hidden="true"
            >
              MJ
            </Box>

            <Stack
              data-testid="main-shell-tabs"
              role="tablist"
              aria-orientation="vertical"
              spacing={0.8}
              sx={{
                alignItems: 'center',
                py: 0.4,
                '& svg': {
                  width: 25,
                  height: 25,
                  overflow: 'visible',
                  filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.14))',
                },
                '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon':
                  {
                    stroke: 'currentColor',
                    fill: 'none',
                    strokeWidth: 1.55,
                    strokeLinecap: 'square',
                    strokeLinejoin: 'miter',
                    vectorEffect: 'non-scaling-stroke',
                  },
              }}
            >
              {visibleTabs.map((tab) => {
                const isSelected = tab.id === selectedTab;
                return (
                  <Button
                    key={tab.id}
                    role="tab"
                    aria-label={tab.label}
                    aria-selected={isSelected}
                    title={tab.label}
                    onMouseEnter={() => openRibbonTab(tab.id)}
                    onFocus={() => openRibbonTab(tab.id, 0)}
                    onClick={() => toggleRibbonTab(tab.id)}
                    sx={{
                      minWidth: 0,
                      width: 64,
                      height: 74,
                      display: 'grid',
                      gridTemplateRows: '48px 22px',
                      justifyItems: 'center',
                      alignItems: 'center',
                      gap: 0,
                      borderRadius: 999,
                      p: 0,
                      color: isSelected ? '#f2fbff' : 'rgba(126, 227, 255, 0.68)',
                      bgcolor: 'transparent',
                      border: 0,
                      boxShadow: 'none',
                      transition:
                        'background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease',
                      '&:hover, &:focus-visible': {
                        color: '#f2fbff',
                      },
                      '&:hover [data-testid="rail-tab-orb"]': {
                        bgcolor: 'rgba(126, 227, 255, 0.1)',
                        borderColor: 'rgba(126, 227, 255, 0.34)',
                        transform: 'translateY(-1px)',
                      },
                      '&:hover [data-testid="rail-tab-label-base"]': {
                        borderBottomColor: 'rgba(126, 227, 255, 0.34)',
                        color: '#f2fbff',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(126, 227, 255, 0.78)',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box
                      data-testid="rail-tab-orb"
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        bgcolor: isSelected ? 'rgba(126, 227, 255, 0.14)' : 'transparent',
                        border: `1px solid ${isSelected ? 'rgba(126, 227, 255, 0.5)' : 'rgba(126, 227, 255, 0.1)'}`,
                        boxShadow: isSelected
                          ? '0 0 22px rgba(126, 227, 255, 0.18), inset 0 0 18px rgba(126, 227, 255, 0.06)'
                          : 'inset 0 0 12px rgba(126, 227, 255, 0.02)',
                        transition:
                          'background-color 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease',
                      }}
                    >
                      <RailTabGlyph id={tab.id} />
                    </Box>
                    <Box
                      data-testid="rail-tab-label-base"
                      component="span"
                      sx={{
                        position: 'relative',
                        width: 62,
                        minHeight: 22,
                        display: 'grid',
                        placeItems: 'center',
                        px: 0.25,
                        pt: 0.45,
                        borderRadius: '0 0 999px 999px',
                        color: isSelected ? '#f0d247' : 'rgba(220, 238, 243, 0.8)',
                        bgcolor: 'transparent',
                        backgroundImage: `
                          radial-gradient(ellipse at 50% 0%, rgba(126, 227, 255, 0.12), transparent 58%),
                          linear-gradient(180deg, rgba(8, 18, 23, 0.34), rgba(8, 18, 23, 0.08))
                        `,
                        border: 0,
                        borderBottom: `1px solid ${isSelected ? 'rgba(240, 210, 71, 0.36)' : 'rgba(126, 227, 255, 0.2)'}`,
                        boxShadow:
                          '0 8px 12px rgba(0,0,0,0.14), inset 0 -5px 10px rgba(126, 227, 255, 0.025)',
                        fontSize: tab.label.length > 7 ? 8.2 : 9.6,
                        fontWeight: 950,
                        lineHeight: 1,
                        letterSpacing: 0,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'clip',
                        transition: 'color 120ms ease, border-color 120ms ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 6,
                          right: 6,
                          top: -6,
                          height: 13,
                          borderTop: `1.5px solid ${isSelected ? 'rgba(126, 227, 255, 0.58)' : 'rgba(126, 227, 255, 0.34)'}`,
                          borderRadius: '50% 50% 0 0',
                          boxShadow: '0 -4px 10px rgba(126, 227, 255, 0.12)',
                          pointerEvents: 'none',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: '50%',
                          top: -9,
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          transform: 'translateX(-50%)',
                          border: '1px solid rgba(126, 227, 255, 0.22)',
                          borderBottomColor: 'transparent',
                          opacity: 0.85,
                          pointerEvents: 'none',
                        },
                      }}
                    >
                      {tab.label}
                    </Box>
                  </Button>
                );
                })}
            </Stack>
          </>
        )}

      </Box>

      {!railMenuCollapsed && selectedTab && (
        <Box
          data-testid="rail-flyout-panel"
          data-open-tab={selectedTab}
          data-anchor-mode="rail-icon-center"
          data-anchor-layout="post-toggle-rail-tab-center"
          data-anchor-index={selectedTabIndex}
          data-anchor-step={RAIL_FLYOUT_TAB_STEP_PX}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={() => closeRibbonTab()}
          sx={{
            position: 'fixed',
            left: { xs: 82, md: 94 },
            top: flyoutAnchorTop,
            transform: 'translateY(-50%)',
            zIndex: 41,
            width: { xs: 'min(72vw, 420px)', sm: 'min(52vw, 520px)' },
            maxHeight: 'calc(100vh - 32px)',
            overflow: 'visible',
            p: 0,
            borderRadius: 0,
            bgcolor: 'transparent',
            backgroundImage: 'none',
            border: 0,
            boxShadow: 'none',
            backdropFilter: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.85,
              alignItems: 'center',
            }}
          >
            {activeItems.map((item) => {
              const isWorkspaceItem = isWorkspaceWindowItem(item);
              const action = (
                <Box
                  data-testid={isWorkspaceItem ? 'workspace-window-launcher' : 'rail-flyout-action'}
                  data-launch-mode={
                    isWorkspaceItem
                      ? item.workspace?.mode === 'multi'
                        ? 'multi-instance'
                        : 'single-instance'
                      : undefined
                  }
                  data-window-policy={item.workspace?.mode}
                  data-menu-path={isWorkspaceItem ? item.path : undefined}
                  data-surface="transparent"
                  data-shape="single-orbital-action"
                  component={Link as any}
                  to={item.path}
                  aria-label={item.label}
                  onClick={(event: any) => {
                    if (isWorkspaceItem) {
                      event.preventDefault();
                      event.stopPropagation();
                      openWorkspaceWindow(item);
                      return;
                    }
                    closeRibbonTab(0);
                  }}
                  sx={{
                    width: 88,
                    minWidth: 88,
                    height: 88,
                    display: 'grid',
                    gridTemplateRows: '43px auto',
                    justifyItems: 'center',
                    alignItems: 'center',
                    alignContent: 'center',
                    gap: 0.2,
                    color: '#7ee3ff',
                    textDecoration: 'none',
                    borderRadius: 999,
                    px: 0.75,
                    py: 0.65,
                    pointerEvents: 'auto',
                    transition:
                      'background-color 120ms ease, color 120ms ease, transform 120ms ease, border-color 120ms ease',
                    border: '1px solid rgba(126, 227, 255, 0.2)',
                    bgcolor: 'rgba(8, 18, 23, 0.22)',
                    backgroundImage:
                      'radial-gradient(circle at 50% 38%, rgba(126, 227, 255, 0.1), transparent 58%)',
                    boxShadow:
                      'inset 0 0 18px rgba(126, 227, 255, 0.035), 0 10px 22px rgba(0,0,0,0.16)',
                    backdropFilter: 'blur(12px)',
                    '&:hover': {
                      color: '#f2fbff',
                      borderColor: 'rgba(126, 227, 255, 0.54)',
                      bgcolor: 'rgba(126, 227, 255, 0.08)',
                      backgroundImage:
                        'radial-gradient(circle at 50% 44%, rgba(126, 227, 255, 0.14), transparent 52%)',
                      boxShadow:
                        '0 0 22px rgba(126, 227, 255, 0.2), inset 0 0 18px rgba(126, 227, 255, 0.06)',
                      transform: 'translateY(-1px)',
                    },
                    '&:focus-visible': {
                      outline: '2px solid rgba(126, 227, 255, 0.78)',
                      outlineOffset: 3,
                    },
                    '& svg': {
                      width: 30,
                      height: 26,
                      overflow: 'visible',
                      filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.18))',
                    },
                    '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon':
                      {
                        stroke: 'currentColor',
                        fill: 'none',
                        strokeWidth: 1.55,
                        strokeLinecap: 'square',
                        strokeLinejoin: 'miter',
                        vectorEffect: 'non-scaling-stroke',
                      },
                  }}
                >
                  {item.icon}
                  <Typography
                    component="span"
                    sx={{
                      maxWidth: 72,
                      color: 'rgba(220, 238, 243, 0.9)',
                      fontSize: 10,
                      fontWeight: 900,
                      lineHeight: 1.05,
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );

              if (!isWorkspaceItem) {
                return <Box key={item.path}>{action}</Box>;
              }

              return (
                <Box
                  key={item.path}
                  data-testid="workspace-window-launcher-host"
                  data-menu-path={item.path}
                  sx={{ position: 'relative', pointerEvents: 'auto' }}
                >
                  {action}
                </Box>
              );
            })}
          </Box>

          {activeItems.length === 0 && (
            <Typography sx={{ px: 1.2, py: 1, color: 'rgba(220, 238, 243, 0.62)', fontSize: 13 }}>
              Yetkili menü bulunamadı.
            </Typography>
          )}
        </Box>
      )}

      {workspaceWindows.length > 0 && (
        <Box
          data-testid="workspace-window-stack"
          data-open-count={workspaceWindows.length}
          data-active-window={activeWorkspaceWindowId ?? undefined}
        >
          {workspaceWindows
            .filter((workspace) => workspace.status === 'maximized')
            .map((workspace) => (
              <WorkspaceWindow
                key={workspace.id}
                workspace={workspace}
                isActive={workspace.id === activeWorkspaceWindowId}
                onActivate={setActiveWorkspaceWindowId}
                onMinimize={minimizeWorkspaceWindow}
                onMaximize={activateWorkspaceWindow}
                onClose={closeWorkspaceWindow}
              />
            ))}
        </Box>
      )}

      {workspaceTaskbarGroups.map((group, index) => (
        <WorkspaceTaskbar
          key={group.menuPath}
          workspaces={group.windows}
          icon={group.icon}
          label={group.label}
          previewOpen={taskbarPreviewMenuPath === group.menuPath}
          onPreviewOpenChange={(open) =>
            setTaskbarPreviewMenuPath((currentMenuPath) =>
              open ? group.menuPath : currentMenuPath === group.menuPath ? null : currentMenuPath,
            )
          }
          onMaximize={activateWorkspaceWindow}
          onClose={closeWorkspaceWindow}
          offsetIndex={index}
          groupCount={workspaceTaskbarGroups.length}
        />
      ))}

      {visibleVideoTabs.length > 0 && (
        <Box
          data-testid="top-video-menu"
          data-nav-style="horizontal-tactical-video"
          data-anchor="top-center-map-hud"
          data-expand-direction="left"
          data-collapsed={videoMenuCollapsed ? 'true' : 'false'}
          sx={{
            position: 'fixed',
            left: '50%',
            top: 0,
            zIndex: 37,
            display: 'grid',
            gap: 0.65,
            justifyItems: 'center',
            maxWidth: { xs: 'calc(100vw - 20px)', md: 'calc(100vw - 130px)' },
            pointerEvents: 'none',
            transform: videoMenuCollapsed
              ? 'translateX(-50%) translateY(-8px)'
              : 'translateX(-50%) translateY(0)',
            transition: 'transform 160ms ease',
          }}
        >
          <Box
            data-testid="top-video-main-row"
            sx={{
              width: 'fit-content',
              display: 'flex',
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 0.6,
              pointerEvents: 'auto',
            }}
          >
            {!videoMenuCollapsed && (
              <Stack
                data-testid="top-video-tabs"
                role="tablist"
                aria-label="İHA video kaynakları"
                direction="row"
                spacing={0.65}
                sx={{
                  alignItems: 'center',
                  width: 'fit-content',
                  px: 0.7,
                  py: 0.55,
                  borderRadius: 999,
                  bgcolor: 'rgba(8, 18, 23, 0.56)',
                  backgroundImage: `
                    radial-gradient(circle at 0% 50%, rgba(126, 227, 255, 0.12), transparent 30%),
                    linear-gradient(90deg, rgba(23, 42, 50, 0.64), rgba(5, 13, 18, 0.54))
                  `,
                  border: '1px solid rgba(126, 227, 255, 0.16)',
                  boxShadow:
                    '14px 18px 34px rgba(0,0,0,0.28), inset 1px 1px 2px rgba(255,255,255,0.045), inset -4px -5px 12px rgba(0,0,0,0.28)',
                  backdropFilter: 'blur(14px) saturate(1.05)',
                  '& svg': {
                    width: 25,
                    height: 25,
                    overflow: 'visible',
                    filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.14))',
                  },
                  '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon':
                    {
                      stroke: 'currentColor',
                      fill: 'none',
                      strokeWidth: 1.55,
                      strokeLinecap: 'square',
                      strokeLinejoin: 'miter',
                      vectorEffect: 'non-scaling-stroke',
                    },
                }}
              >
                {visibleVideoTabs.map((tab) => {
                  const isSelected = tab.id === selectedVideoTab;
                  return (
                    <Button
                      key={tab.id}
                      role="tab"
                      aria-label={tab.label}
                      aria-selected={isSelected}
                      title={tab.label}
                      onClick={() => toggleVideoTab(tab.id)}
                      sx={{
                        minWidth: 0,
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        p: 0,
                        color: isSelected ? '#f2fbff' : 'rgba(126, 227, 255, 0.68)',
                        bgcolor: isSelected ? 'rgba(126, 227, 255, 0.14)' : 'transparent',
                        border: `1px solid ${isSelected ? 'rgba(126, 227, 255, 0.5)' : 'rgba(126, 227, 255, 0.1)'}`,
                        boxShadow: isSelected
                          ? '0 0 22px rgba(126, 227, 255, 0.18), inset 0 0 18px rgba(126, 227, 255, 0.06)'
                          : 'inset 0 0 12px rgba(126, 227, 255, 0.02)',
                        transition:
                          'background-color 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease',
                        '&:hover': {
                          color: '#f2fbff',
                          bgcolor: 'rgba(126, 227, 255, 0.1)',
                          borderColor: 'rgba(126, 227, 255, 0.34)',
                          transform: 'translateY(-1px)',
                        },
                        '&:focus-visible': {
                          outline: '2px solid rgba(126, 227, 255, 0.78)',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <RailTabGlyph id={tab.id} />
                    </Button>
                  );
                })}
              </Stack>
            )}

            <Button
              data-testid="top-video-collapse-toggle"
              aria-label={videoMenuCollapsed ? 'İHA menüsünü aç' : 'İHA menüsünü kapat'}
              aria-expanded={!videoMenuCollapsed}
              onClick={toggleVideoMenuCollapsed}
              sx={{
                minWidth: 0,
                width: videoMenuCollapsed ? 54 : 36,
                height: 36,
                borderRadius: 999,
                p: 0,
                display: 'grid',
                gridTemplateColumns: videoMenuCollapsed ? '24px 12px' : '1fr',
                placeItems: 'center',
                columnGap: 0.25,
                color: '#7ee3ff',
                bgcolor: 'rgba(8, 18, 23, 0.56)',
                border: '1px solid rgba(126, 227, 255, 0.2)',
                boxShadow:
                  'inset 1px 1px 2px rgba(255,255,255,0.05), inset -3px -4px 7px rgba(0,0,0,0.34)',
                backdropFilter: 'blur(12px)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
                textTransform: 'none',
                '& svg': {
                  width: 24,
                  height: 18,
                  overflow: 'visible',
                  filter: 'drop-shadow(0 0 7px rgba(126, 227, 255, 0.14))',
                },
                '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon': {
                  stroke: 'currentColor',
                  fill: 'none',
                  strokeWidth: 1.55,
                  strokeLinecap: 'square',
                  strokeLinejoin: 'miter',
                  vectorEffect: 'non-scaling-stroke',
                },
                '&:hover': {
                  color: '#f2fbff',
                  bgcolor: 'rgba(126, 227, 255, 0.1)',
                  borderColor: 'rgba(126, 227, 255, 0.34)',
                },
                '&:focus-visible': {
                  outline: '2px solid rgba(126, 227, 255, 0.78)',
                  outlineOffset: 2,
                },
              }}
            >
              {videoMenuCollapsed ? (
                <>
                  <RailTabGlyph id="gozcu" />
                  <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>
                    v
                  </Box>
                </>
              ) : (
                '^'
              )}
            </Button>
          </Box>
          {!videoMenuCollapsed && selectedVideoTab && (
            <Stack
              data-testid="top-video-sources"
              data-placement="below-main-menu"
              direction="row-reverse"
              spacing={0.8}
              sx={{
                alignItems: 'center',
                justifyContent: 'flex-start',
                maxWidth: '100%',
                overflowX: 'auto',
                py: 0.2,
                pointerEvents: 'auto',
              }}
            >
              {activeVideoItems.map((item) => {
                const isOnline = item.status === 'online';
                return (
                  <Box
                    key={item.path}
                    data-testid="top-video-source"
                    data-status={item.status}
                    component={Link as any}
                    to={item.path}
                    aria-label={`${item.label} ${isOnline ? 'online' : 'offline'}`}
                    onClick={() => setOpenVideoTab(null)}
                    sx={{
                      width: 82,
                      minWidth: 82,
                      height: 82,
                      display: 'grid',
                      gridTemplateRows: '44px auto',
                      justifyItems: 'center',
                      alignItems: 'center',
                      alignContent: 'center',
                      gap: 0.15,
                      color: '#7ee3ff',
                      textDecoration: 'none',
                      borderRadius: 999,
                      border: '1px solid rgba(126, 227, 255, 0.2)',
                      bgcolor: 'rgba(8, 18, 23, 0.22)',
                      backgroundImage:
                        'radial-gradient(circle at 50% 38%, rgba(126, 227, 255, 0.1), transparent 58%)',
                      boxShadow:
                        'inset 0 0 18px rgba(126, 227, 255, 0.035), 0 10px 22px rgba(0,0,0,0.16)',
                      backdropFilter: 'blur(12px)',
                      transition:
                        'background-color 120ms ease, border-color 120ms ease, transform 120ms ease, color 120ms ease',
                      '&:hover': {
                        color: '#f2fbff',
                        borderColor: 'rgba(126, 227, 255, 0.42)',
                        bgcolor: 'rgba(126, 227, 255, 0.08)',
                        transform: 'translateY(-1px)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid rgba(126, 227, 255, 0.78)',
                        outlineOffset: 3,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: 48,
                        height: 42,
                        display: 'grid',
                        placeItems: 'center',
                        '& svg': {
                          width: 30,
                          height: 24,
                          overflow: 'visible',
                        },
                        '& svg path, & svg circle, & svg line, & svg polyline, & svg rect, & svg polygon':
                          {
                            stroke: 'currentColor',
                            fill: 'none',
                            strokeWidth: 1.55,
                            strokeLinecap: 'square',
                            strokeLinejoin: 'miter',
                            vectorEffect: 'non-scaling-stroke',
                          },
                      }}
                    >
                      {item.icon}
                      <Box
                        data-testid="video-status-dot"
                        sx={{
                          position: 'absolute',
                          right: 2,
                          top: 4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: isOnline ? '#2fff8f' : '#ff3b4f',
                          boxShadow: isOnline
                            ? '0 0 10px rgba(47, 255, 143, 0.72)'
                            : '0 0 10px rgba(255, 59, 79, 0.72)',
                        }}
                      />
                    </Box>
                    <Typography
                      component="span"
                      sx={{
                        maxWidth: 70,
                        color: 'rgba(220, 238, 243, 0.9)',
                        fontSize: 10,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        textAlign: 'center',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: 'fixed',
          top: { xs: 10, md: 16 },
          right: { xs: 10, md: 18 },
          zIndex: 38,
          alignItems: 'center',
          maxWidth: 'calc(100vw - 120px)',
        }}
      >
        <Box
          data-testid="rail-command-search"
          data-affordance="command-search"
          sx={{
            width: { xs: 168, sm: 240 },
            height: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            px: 1,
            color: 'rgba(220, 238, 243, 0.78)',
            bgcolor: 'rgba(5, 14, 18, 0.5)',
            border: '1px solid rgba(126, 227, 255, 0.22)',
            borderRadius: 999,
            boxShadow:
              '0 0 18px rgba(126, 227, 255, 0.05), inset 2px 2px 5px rgba(0,0,0,0.52), inset -1px -1px 2px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
          aria-label="Komut ara"
        >
          <SearchIcon sx={{ fontSize: 17, color: '#7ee3ff' }} />
          <Typography sx={{ fontSize: 12, color: 'rgba(220, 238, 243, 0.78)' }}>
            Komut ara
          </Typography>
          <Box
            component="span"
            sx={{
              ml: 'auto',
              px: 0.75,
              py: 0.15,
              borderRadius: 999,
              border: '1px solid rgba(126, 227, 255, 0.18)',
              color: 'rgba(220, 238, 243, 0.5)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            K
          </Box>
        </Box>

        <Typography
          sx={{
            display: { xs: 'none', sm: 'block' },
            minWidth: 54,
            textAlign: 'right',
            color: '#f0d247',
            fontSize: 12,
            fontWeight: 900,
            textShadow: '0 0 12px rgba(240, 210, 71, 0.2)',
          }}
        >
          {user?.username}
        </Typography>
        <Button
          onClick={onLogout}
          startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
          sx={{
            minHeight: 34,
            px: 1.15,
            color: 'rgba(220, 238, 243, 0.88)',
            bgcolor: 'rgba(15, 29, 36, 0.46)',
            border: '1px solid rgba(126, 227, 255, 0.16)',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'none',
            boxShadow:
              'inset 1px 1px 2px rgba(255,255,255,0.05), inset -3px -4px 7px rgba(0,0,0,0.34)',
            backdropFilter: 'blur(12px)',
            '&:hover': { bgcolor: 'rgba(126, 227, 255, 0.08)' },
            '&:focus-visible': {
              outline: '2px solid rgba(126, 227, 255, 0.78)',
              outlineOffset: 2,
            },
          }}
        >
          Çıkış
        </Button>
      </Stack>

      <Box component="main" sx={{ minHeight: '100vh', minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
