import { useState, type CSSProperties } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { shellActions } from '../store/shellSlice';
import { authApi } from './authApi';
import { shellConfig } from '../config';

type LoginThemeId = 'soft-command' | 'tactical-neo';

type LoginTheme = {
  id: LoginThemeId;
  label: string;
  cssVars: CSSProperties;
  rootBackgroundImage: string;
  rootBackgroundSize: string;
  overlayBackgroundImage: string;
};

const LOGIN_THEMES: LoginTheme[] = [
  {
    id: 'soft-command',
    label: 'Soft Command',
    cssVars: {
      '--login-surface': '#dfe8ee',
      '--login-surface-dark': '#b8c4cb',
      '--login-surface-light': '#ffffff',
      '--login-text': '#26333b',
      '--login-text-muted': 'rgba(38, 51, 59, 0.68)',
      '--login-accent': '#f3d64a',
      '--login-accent-hover': '#ffe46b',
      '--login-cta-text': '#26333b',
      '--login-line': 'rgba(94, 111, 121, 0.26)',
      '--login-cyan': '#5f7884',
      '--login-cyan-hover': '#455f6c',
      '--login-node-fill': 'rgba(95, 120, 132, 0.12)',
      '--login-node-fill-warm': 'rgba(243, 214, 74, 0.28)',
      '--login-node-surface': '#dfe8ee',
      '--login-node-highlight': 'rgba(255,255,255,0.9)',
      '--login-node-shadow': 'rgba(146,160,168,0.68)',
      '--login-node-rim': 'rgba(94, 111, 121, 0.1)',
      '--login-symbol-fill': '#d8e2e8',
      '--login-symbol-warm-fill': '#f3d64a',
      '--login-symbol-stroke': 'rgba(72, 94, 104, 0.68)',
      '--login-symbol-warm-stroke': 'rgba(129, 105, 24, 0.62)',
      '--login-symbol-highlight': 'rgba(255,255,255,0.86)',
      '--login-symbol-shadow': 'rgba(134,149,157,0.72)',
      '--login-symbol-line-opacity': '0.62',
      '--login-symbol-opacity': '0.94',
      '--login-network-opacity': '0.24',
      '--login-edge-stroke': '#8d9da5',
      '--login-edge-opacity': '0.24',
      '--login-glow-opacity': '0.45',
      '--login-glow-warm-opacity': '0.5',
      '--login-panel-halo-shadow': '22px 22px 44px rgba(174, 187, 195, 0.8), -22px -22px 44px rgba(255,255,255,0.88)',
      '--login-panel-halo-opacity': '0.54',
      '--login-warm-rim': 'radial-gradient(circle closest-side, transparent 69%, rgba(243, 214, 74, 0.2) 72%, transparent 78%)',
      '--login-paper-border': '1px solid rgba(255, 255, 255, 0.54)',
      '--login-brand-border': '1px solid rgba(255, 255, 255, 0.5)',
      '--login-globe-bg': 'radial-gradient(circle at 50% 36%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 54% 66%, rgba(184,196,203,0.46), transparent 45%), var(--login-surface)',
      '--login-globe-opacity': '0.055',
      '--login-globe-filter': 'grayscale(1) contrast(0.8)',
      '--login-title-shadow': '1px 1px 0 rgba(255,255,255,0.9), -1px -1px 0 rgba(184,196,203,0.55)',
      '--login-top-title-shadow': '1px 1px 0 rgba(255,255,255,0.9), -1px -1px 0 rgba(184,196,203,0.35)',
      '--login-node-strip-shadow': '1px 1px 0 rgba(255,255,255,0.7)',
      '--login-error-bg': '#e8d6d9',
      '--login-error-color': '#8b1e2d',
      '--login-error-border': '1px solid rgba(211, 47, 47, 0.18)',
      '--login-red-mark-shadow': 'inset 2px 2px 4px rgba(146, 40, 38, 0.35), inset -2px -2px 4px rgba(255,255,255,0.6)',
      '--login-selection-bg': 'rgba(255,255,255,0.34)',
      '--login-field-border': 'rgba(72, 94, 104, 0.32)',
      '--login-field-border-hover': 'rgba(72, 94, 104, 0.56)',
      '--login-field-focus-border': 'rgba(72, 94, 104, 0.56)',
      '--login-field-focus': '#455f6c',
      '--login-focus-ring': 'rgba(72, 94, 104, 0.16)',
      '--login-control-bg': 'rgba(223, 232, 238, 0.96)',
    } as CSSProperties,
    rootBackgroundImage: `
      linear-gradient(90deg, rgba(94, 111, 121, 0.055) 1px, transparent 1px),
      linear-gradient(0deg, rgba(94, 111, 121, 0.04) 1px, transparent 1px),
      radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.72), transparent 30%),
      radial-gradient(circle at 78% 72%, rgba(184, 196, 203, 0.46), transparent 34%),
      linear-gradient(180deg, #e7eff3 0%, #dfe8ee 48%, #d5e0e6 100%)
    `,
    rootBackgroundSize: '20px 20px, 20px 20px, 100% 100%, 100% 100%, 100% 100%',
    overlayBackgroundImage: `
      radial-gradient(circle, rgba(255, 255, 255, 0.55) 1px, transparent 1.6px),
      linear-gradient(90deg, rgba(94, 111, 121, 0.035) 1px, transparent 1px),
      linear-gradient(0deg, rgba(94, 111, 121, 0.03) 1px, transparent 1px)
    `,
  },
  {
    id: 'tactical-neo',
    label: 'Tactical Neo',
    cssVars: {
      '--login-surface': '#19262e',
      '--login-surface-dark': '#10191e',
      '--login-surface-light': '#263844',
      '--login-text': '#dcebf2',
      '--login-text-muted': 'rgba(220, 235, 242, 0.68)',
      '--login-accent': '#f3d64a',
      '--login-accent-hover': '#ffe46b',
      '--login-cta-text': '#0a1216',
      '--login-line': 'rgba(126, 227, 255, 0.18)',
      '--login-cyan': '#7ee3ff',
      '--login-cyan-hover': '#a8edff',
      '--login-node-fill': 'rgba(126, 227, 255, 0.13)',
      '--login-node-fill-warm': 'rgba(243, 214, 74, 0.2)',
      '--login-node-surface': '#19262e',
      '--login-node-highlight': 'rgba(38,56,68,0.92)',
      '--login-node-shadow': 'rgba(6,10,13,0.86)',
      '--login-node-rim': 'rgba(126, 227, 255, 0.13)',
      '--login-symbol-fill': '#20313a',
      '--login-symbol-warm-fill': '#d8bd3d',
      '--login-symbol-stroke': 'rgba(126, 227, 255, 0.7)',
      '--login-symbol-warm-stroke': 'rgba(243, 214, 74, 0.78)',
      '--login-symbol-highlight': 'rgba(53,75,88,0.84)',
      '--login-symbol-shadow': 'rgba(4,9,12,0.88)',
      '--login-symbol-line-opacity': '0.7',
      '--login-symbol-opacity': '0.95',
      '--login-network-opacity': '0.52',
      '--login-edge-stroke': '#f3d64a',
      '--login-edge-opacity': '0.34',
      '--login-glow-opacity': '0.48',
      '--login-glow-warm-opacity': '0.5',
      '--login-panel-halo-shadow': '18px 18px 34px rgba(10, 16, 20, 0.92), -18px -18px 34px rgba(38, 56, 68, 0.85)',
      '--login-panel-halo-opacity': '0.92',
      '--login-warm-rim': 'radial-gradient(circle closest-side, transparent 63%, rgba(243, 214, 74, 0.18) 72%, transparent 84%)',
      '--login-paper-border': '1px solid rgba(126, 227, 255, 0.22)',
      '--login-brand-border': '1px solid rgba(126, 227, 255, 0.22)',
      '--login-globe-bg': 'radial-gradient(circle at 50% 36%, rgba(38,56,68,0.78), transparent 42%), radial-gradient(circle at 54% 66%, rgba(10,16,20,0.76), transparent 45%), var(--login-surface)',
      '--login-globe-opacity': '0.12',
      '--login-globe-filter': 'grayscale(0.7) contrast(0.9)',
      '--login-title-shadow': '0 1px 2px rgba(0,0,0,0.85), 0 0 16px rgba(243,214,74,0.18)',
      '--login-top-title-shadow': '0 2px 18px rgba(0,0,0,0.45), 0 0 18px rgba(126,227,255,0.14)',
      '--login-node-strip-shadow': '0 1px 8px rgba(0,0,0,0.7)',
      '--login-error-bg': 'rgba(69, 14, 20, 0.78)',
      '--login-error-color': '#ffcdd2',
      '--login-error-border': '1px solid rgba(239, 83, 80, 0.24)',
      '--login-red-mark-shadow': '0 0 0 1px rgba(126, 227, 255, 0.22), inset 2px 2px 4px rgba(80, 10, 10, 0.5)',
      '--login-selection-bg': 'rgba(126,227,255,0.08)',
      '--login-field-border': 'rgba(126, 227, 255, 0.28)',
      '--login-field-border-hover': 'rgba(126, 227, 255, 0.52)',
      '--login-field-focus-border': 'rgba(126, 227, 255, 0.52)',
      '--login-field-focus': '#f3d64a',
      '--login-focus-ring': 'rgba(126, 227, 255, 0.16)',
      '--login-control-bg': 'rgba(25, 38, 46, 0.96)',
    } as CSSProperties,
    rootBackgroundImage: `
      linear-gradient(90deg, rgba(126, 227, 255, 0.045) 1px, transparent 1px),
      linear-gradient(0deg, rgba(126, 227, 255, 0.032) 1px, transparent 1px),
      radial-gradient(circle at 28% 24%, rgba(36, 96, 126, 0.24), transparent 34%),
      radial-gradient(circle at 78% 72%, rgba(7, 12, 15, 0.48), transparent 34%),
      linear-gradient(180deg, #16232b 0%, #19262e 48%, #132027 100%)
    `,
    rootBackgroundSize: '18px 18px, 18px 18px, 100% 100%, 100% 100%, 100% 100%',
    overlayBackgroundImage: `
      radial-gradient(circle, rgba(126, 227, 255, 0.08) 1px, transparent 1.6px),
      linear-gradient(90deg, rgba(126, 227, 255, 0.04) 1px, transparent 1px),
      linear-gradient(0deg, rgba(126, 227, 255, 0.032) 1px, transparent 1px)
    `,
  },
];

const LOGIN_THEME_BY_ID: Record<LoginThemeId, LoginTheme> = {
  'soft-command': LOGIN_THEMES[0]!,
  'tactical-neo': LOGIN_THEMES[1]!,
};

const NEO_SURFACE = 'var(--login-surface)';
const NEO_SURFACE_DARK = 'var(--login-surface-dark)';
const NEO_SURFACE_LIGHT = 'var(--login-surface-light)';
const NEO_TEXT = 'var(--login-text)';
const NEO_TEXT_MUTED = 'var(--login-text-muted)';
const NEO_ACCENT = 'var(--login-accent)';
const NEO_ACCENT_HOVER = 'var(--login-accent-hover)';
const NEO_CTA_TEXT = 'var(--login-cta-text)';
const NEO_LINE = 'var(--login-line)';
const NEO_SHADOW_RAISED = `14px 14px 28px ${NEO_SURFACE_DARK}, -14px -14px 28px ${NEO_SURFACE_LIGHT}`;
const NEO_SHADOW_SOFT = `8px 8px 16px ${NEO_SURFACE_DARK}, -8px -8px 16px ${NEO_SURFACE_LIGHT}`;
const NEO_SHADOW_INSET = `inset 5px 5px 10px ${NEO_SURFACE_DARK}, inset -5px -5px 10px ${NEO_SURFACE_LIGHT}`;
const HUD_CYAN = 'var(--login-cyan)';
const HUD_CYAN_DIM = NEO_LINE;
const HUD_CYAN_HOVER = 'var(--login-cyan-hover)';
const HUD_YELLOW = NEO_ACCENT;
/** Brand red — forte circle + “Mil” only (footer logo strip) */
const HUD_RED = '#e53935';
const HUD_TEXT = NEO_TEXT;
/** Title on globe */
const HUD_TITLE = NEO_TEXT;

/** Form stack + inputs share width inside circular panel */
const LOGIN_PANEL_CONTENT_MAX = 236;

const loginFieldSx = {
  '& .MuiInputLabel-root': {
    color: NEO_TEXT_MUTED,
    fontSize: 15,
    bgcolor: NEO_SURFACE,
    px: 0.35,
    '&.Mui-focused': {
      color: 'var(--login-field-focus-border)',
    },
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(11px, -7px) scale(0.78)',
  },
  '& .MuiOutlinedInput-root': {
    height: 44,
    borderRadius: '12px',
    bgcolor: 'var(--login-control-bg)',
    color: NEO_TEXT,
    boxShadow: `inset 3px 3px 7px ${NEO_SURFACE_DARK}, inset -3px -3px 7px ${NEO_SURFACE_LIGHT}`,
    transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
    '& fieldset': {
      borderColor: 'var(--login-field-border)',
      borderWidth: 1,
    },
    '&:hover': {
      bgcolor: 'var(--login-control-bg)',
      '& fieldset': {
        borderColor: 'var(--login-field-border-hover)',
      },
    },
    '&.Mui-focused': {
      bgcolor: 'var(--login-control-bg)',
      color: NEO_TEXT,
      boxShadow: `inset 2px 2px 5px ${NEO_SURFACE_DARK}, inset -2px -2px 5px ${NEO_SURFACE_LIGHT}, 0 0 0 3px var(--login-focus-ring)`,
      '& fieldset': {
        borderColor: 'var(--login-field-focus-border)',
        borderWidth: 2,
      },
    },
    '& .MuiIconButton-root': {
      width: 36,
      height: 36,
      borderRadius: '10px',
      color: NEO_TEXT_MUTED,
      '&.Mui-focusVisible': {
        outline: '2px solid var(--login-field-focus-border)',
        outlineOffset: 1,
      },
    },
    '&.Mui-focused .MuiIconButton-root': {
      color: NEO_TEXT,
    },
  },
  '& .MuiOutlinedInput-input': {
    height: '100%',
    boxSizing: 'border-box',
    py: 0,
    px: 1.25,
    fontSize: 15,
  },
  '& .MuiOutlinedInput-notchedOutline legend': {
    fontSize: 9,
  },
};

type NodeKind =
  | 'sat'
  | 'jet'
  | 'drone'
  | 'radar'
  | 'sensor'
  | 'cmd'
  | 'cyber'
  | 'tank'
  | 'ship'
  | 'sub';

type NodeSpec = { cx: number; cy: number; kind: NodeKind; label: string };

const NODES: NodeSpec[] = [
  // Inner ring R=170, 8 nodes at 45° steps around panel center (410, 250)
  { cx: 410, cy: 80, kind: 'sat', label: 'SAT-01' },
  { cx: 530, cy: 130, kind: 'jet', label: 'AIR-01' },
  { cx: 580, cy: 250, kind: 'radar', label: 'RDR-01' },
  { cx: 530, cy: 370, kind: 'ship', label: 'NAV-01' },
  { cx: 410, cy: 420, kind: 'sub', label: 'SUB-01' },
  { cx: 290, cy: 370, kind: 'tank', label: 'GND-01' },
  { cx: 240, cy: 250, kind: 'sensor', label: 'SIG-01' },
  { cx: 290, cy: 130, kind: 'drone', label: 'UAV-01' },
  // Outer ring R=240, 12 nodes at 30° steps with 15° offset
  { cx: 472, cy: 18, kind: 'sat', label: 'SAT-02' },
  { cx: 580, cy: 80, kind: 'jet', label: 'AIR-02' },
  { cx: 642, cy: 188, kind: 'drone', label: 'UAV-02' },
  { cx: 642, cy: 312, kind: 'radar', label: 'RDR-02' },
  { cx: 580, cy: 420, kind: 'ship', label: 'NAV-02' },
  { cx: 472, cy: 482, kind: 'sub', label: 'SUB-02' },
  { cx: 348, cy: 482, kind: 'sub', label: 'SUB-03' },
  { cx: 240, cy: 420, kind: 'tank', label: 'GND-02' },
  { cx: 178, cy: 312, kind: 'sensor', label: 'SIG-02' },
  { cx: 178, cy: 188, kind: 'cyber', label: 'CYB-01' },
  { cx: 240, cy: 80, kind: 'cyber', label: 'CYB-02' },
  { cx: 348, cy: 18, kind: 'jet', label: 'AIR-03' },
];

const EDGES: Array<[number, number]> = [
  // Inner ring chain (closes loop)
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  // Outer ring chain (closes loop)
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  [15, 16], [16, 17], [17, 18], [18, 19], [19, 8],
  // Radial spokes - each outer to its nearest inner
  [0, 8], [0, 19],
  [1, 9],
  [2, 10], [2, 11],
  [3, 12],
  [4, 13], [4, 14],
  [5, 15],
  [6, 16], [6, 17],
  [7, 18],
];

const NODE_KIND_LABELS: Record<NodeKind, string> = {
  sat: 'Uydu',
  jet: 'Hava unsuru',
  drone: 'IHA',
  radar: 'Radar',
  sensor: 'Sinyal sensoru',
  cmd: 'Komuta',
  cyber: 'Siber',
  tank: 'Kara unsuru',
  ship: 'Deniz unsuru',
  sub: 'Denizalti',
};

const NETWORK_VIEWBOX_WIDTH = 820;
const NETWORK_VIEWBOX_HEIGHT = 500;
const LOGIN_PANEL_CENTER_X = 410;
const LOGIN_PANEL_CENTER_Y = 250;
const NODE_PEEK_PANEL_WIDTH = 58;
const NODE_PEEK_PANEL_HEIGHT = 22;
const NODE_PEEK_PANEL_MARGIN = 12;
const NODE_PEEK_PANEL_OFFSET = 18;
const NODE_PEEK_CENTER_DEADZONE = 8;

const getConnectedNodeIndexes = (nodeIndex: number) =>
  EDGES.reduce<number[]>((connectedIndexes, [startIndex, endIndex]) => {
    if (startIndex === nodeIndex) connectedIndexes.push(endIndex);
    if (endIndex === nodeIndex) connectedIndexes.push(startIndex);
    return connectedIndexes;
  }, []);

const getNodeConnectionLabels = (nodeIndex: number) =>
  getConnectedNodeIndexes(nodeIndex)
    .map((connectedIndex) => NODES[connectedIndex]?.label)
    .filter((label): label is string => Boolean(label));

const getNodeAriaLabel = (nodeIndex: number) => {
  const node = NODES[nodeIndex];
  if (!node) return 'Network node';

  const connectedLabels = getNodeConnectionLabels(nodeIndex).join(', ');
  return `${node.label}. ${NODE_KIND_LABELS[node.kind]}. Bagli dugumler: ${connectedLabels}.`;
};

const getPeekPanelPosition = (node: NodeSpec) => {
  const deltaX = node.cx - LOGIN_PANEL_CENTER_X;
  const deltaY = node.cy - LOGIN_PANEL_CENTER_Y;
  const preferredX =
    Math.abs(deltaX) <= NODE_PEEK_CENTER_DEADZONE
      ? node.cx - NODE_PEEK_PANEL_WIDTH / 2
      : deltaX > 0
        ? node.cx + NODE_PEEK_PANEL_OFFSET
        : node.cx - NODE_PEEK_PANEL_WIDTH - NODE_PEEK_PANEL_OFFSET;
  const preferredY =
    Math.abs(deltaY) <= NODE_PEEK_CENTER_DEADZONE
      ? node.cy - NODE_PEEK_PANEL_HEIGHT / 2
      : deltaY > 0
        ? node.cy + NODE_PEEK_PANEL_OFFSET
        : node.cy - NODE_PEEK_PANEL_HEIGHT - NODE_PEEK_PANEL_OFFSET;
  const minX = NODE_PEEK_PANEL_MARGIN;
  const minY = NODE_PEEK_PANEL_MARGIN;
  const maxX = NETWORK_VIEWBOX_WIDTH - NODE_PEEK_PANEL_WIDTH - NODE_PEEK_PANEL_MARGIN;
  const maxY = NETWORK_VIEWBOX_HEIGHT - NODE_PEEK_PANEL_HEIGHT - NODE_PEEK_PANEL_MARGIN;

  return {
    x: Math.min(Math.max(preferredX, minX), maxX),
    y: Math.min(Math.max(preferredY, minY), maxY),
  };
};

const renderIcon = (kind: NodeKind, cx: number, cy: number) => {
  const cyan = 'var(--login-symbol-stroke)';
  const accent = 'var(--login-symbol-warm-stroke)';
  const fillWarm = 'url(#neoSymbolWarmSurface)';
  const lineOpacity = 'var(--login-symbol-line-opacity)';
  const coreOpacity = 0.18;
  const strokeWidth = 1.25;

  switch (kind) {
    case 'sat':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -13,0 H -6 M 6,0 H 13 M 0,-13 V -6 M 0,6 V 13" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <rect x={-4.2} y={-4.2} width={8.4} height={8.4} transform="rotate(45)" stroke={accent} strokeWidth={strokeWidth} />
          <path d="M -12,-5 L -7,-1 M -12,5 L -7,1 M 12,-5 L 7,-1 M 12,5 L 7,1" stroke={cyan} strokeWidth={1.05} />
          <circle cx={0} cy={0} r={1.5} fill={fillWarm} stroke={accent} strokeWidth={0.55} />
        </g>
      );
    case 'jet':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path
            d="M 0,-12 L 9,8 L 0,4 L -9,8 Z"
            stroke={cyan}
            strokeWidth={strokeWidth}
          />
          <line x1={0} y1={-10} x2={0} y2={7} stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.9} />
          <path d="M -5,-1 H 5 M -3,7 H 3" stroke={accent} strokeWidth={1} />
          <circle cx={0} cy={-3} r={1.35} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    case 'drone':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M 0,-6 L 6,0 L 0,6 L -6,0 Z" stroke={accent} strokeWidth={strokeWidth} />
          <path d="M -5,-5 L -9,-9 M 5,-5 L 9,-9 M 5,5 L 9,9 M -5,5 L -9,9" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <rect x={-11} y={-11} width={4} height={4} stroke={cyan} strokeWidth={1} />
          <rect x={7} y={-11} width={4} height={4} stroke={cyan} strokeWidth={1} />
          <rect x={7} y={7} width={4} height={4} stroke={cyan} strokeWidth={1} />
          <rect x={-11} y={7} width={4} height={4} stroke={cyan} strokeWidth={1} />
          <circle cx={0} cy={0} r={1.4} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    case 'radar':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -11,8 L 0,-10 L 11,8" stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -6,3 A 8,8 0 0 1 6,3" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <path d="M -9,7 A 12,12 0 0 1 9,7" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.9} />
          <line x1={0} y1={8} x2={0} y2={-9} stroke={accent} strokeWidth={1.1} />
          <line x1={0} y1={8} x2={8} y2={-2} stroke={cyan} strokeOpacity={0.82} strokeWidth={1} />
          <circle cx={0} cy={8} r={1.25} fill={fillWarm} stroke={accent} strokeWidth={0.45} />
        </g>
      );
    case 'sensor':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <line x1={0} y1={-11} x2={0} y2={8} stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -7,-7 H -3 M 3,-7 H 7 M -9,-3 H -4 M 4,-3 H 9" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <rect x={-5.5} y={8} width={11} height={2.5} stroke={cyan} strokeWidth={0.9} />
          <path d="M -4,4 H 4" stroke={accent} strokeWidth={1.1} />
          <circle cx={0} cy={-11} r={1.4} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    case 'cmd':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M 0,-12 L 12,0 L 0,12 L -12,0 Z" stroke={accent} strokeWidth={1.45} fill={fillWarm} fillOpacity={coreOpacity} />
          <path d="M -7,0 H 7 M 0,-7 V 7" stroke={accent} strokeWidth={1.25} />
          <path d="M -10,-4 V -10 H -4 M 4,-10 H 10 V -4 M 10,4 V 10 H 4 M -4,10 H -10 V 4" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.9} />
          <circle cx={0} cy={0} r={1.45} fill={fillWarm} stroke={accent} strokeWidth={0.55} />
        </g>
      );
    case 'cyber':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -6,-10 H 6 L 12,0 L 6,10 H -6 L -12,0 Z" stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -6,-4 H 0 V 4 H 6 M 0,-4 H 6 M -6,4 H 0" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.95} />
          <circle cx={-6} cy={-4} r={1.1} fill={fillWarm} stroke={accent} strokeWidth={0.45} />
          <circle cx={6} cy={-4} r={1.1} fill={fillWarm} stroke={accent} strokeWidth={0.45} />
          <circle cx={-6} cy={4} r={1.1} fill={fillWarm} stroke={accent} strokeWidth={0.45} />
          <circle cx={6} cy={4} r={1.1} fill={fillWarm} stroke={accent} strokeWidth={0.45} />
        </g>
      );
    case 'tank':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -11,3 H 9 L 12,6 H -12 Z" stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -6,-5 H 4 V 3 H -6 Z" stroke={cyan} strokeWidth={1.05} />
          <line x1={4} y1={-2} x2={13} y2={-2} stroke={cyan} strokeWidth={1.4} />
          <path d="M -8,8 H 8" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <circle cx={0} cy={-1} r={1.25} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    case 'ship':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -12,3 H 12 L 7,9 H -7 Z" stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -7,0 H 7 M -3,-5 H 3 V 0" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <line x1={0} y1={-9} x2={0} y2={-5} stroke={cyan} strokeWidth={1} />
          <path d="M -10,11 H 10" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.9} />
          <circle cx={0} cy={3} r={1.25} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    case 'sub':
      return (
        <g transform={`translate(${cx},${cy})`} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M -12,5 C -8,1 8,1 12,5 C 8,9 -8,9 -12,5 Z" stroke={cyan} strokeWidth={strokeWidth} />
          <path d="M -2,1 V -6 H 5 M 5,-6 H 9" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={1} />
          <path d="M -7,11 H 7" stroke={cyan} strokeOpacity={lineOpacity} strokeWidth={0.9} />
          <circle cx={0} cy={5} r={1.25} fill={fillWarm} stroke={accent} strokeWidth={0.5} />
        </g>
      );
    default:
      return null;
  }
};

const NetworkBackdrop = () => {
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);
  const activeNode = activeNodeIndex === null ? null : NODES[activeNodeIndex] ?? null;
  const activeConnectedIndexes = activeNodeIndex === null ? [] : getConnectedNodeIndexes(activeNodeIndex);
  const activeConnectedNodeIndexes = new Set(activeConnectedIndexes);
  const activeNodeConnectionLabels = activeNodeIndex === null ? [] : getNodeConnectionLabels(activeNodeIndex);
  const activePanelPosition = activeNode ? getPeekPanelPosition(activeNode) : null;
  const activateNode = (nodeIndex: number) => {
    setActiveNodeIndex((currentIndex) => (currentIndex === nodeIndex ? currentIndex : nodeIndex));
  };
  const clearActiveNode = () => {
    setActiveNodeIndex((currentIndex) => (currentIndex === null ? currentIndex : null));
  };

  return (
    <Box
    data-testid="network-backdrop"
    data-interaction="node-peek"
    data-hover-profile="instant-tactical"
    data-active-node={activeNode?.label}
    data-node-style="neumorphic"
    data-symbol-style="neumorphic"
    data-motion="signal-flow"
    data-reduced-motion="css-media"
    component="svg"
    viewBox="0 0 820 500"
    preserveAspectRatio="xMidYMid slice"
    sx={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      opacity: 'var(--login-network-opacity)',
      pointerEvents: 'none',
    }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') clearActiveNode();
    }}
  >
    <defs>
      <style>
        {`
          @keyframes loginSignalFlow {
            from { stroke-dashoffset: 1; opacity: 0; }
            18% { opacity: 0.74; }
            82% { opacity: 0.74; }
            to { stroke-dashoffset: 0; opacity: 0; }
          }

          .login-signal-pulse {
            stroke-dasharray: 0.08 0.92;
            stroke-dashoffset: 1;
            animation: loginSignalFlow 3.8s linear infinite;
          }

          .login-signal-pulse-1 { animation-delay: 0.45s; }
          .login-signal-pulse-2 { animation-delay: 0.9s; }
          .login-signal-pulse-3 { animation-delay: 1.35s; }

          .login-network-edge,
          .login-network-node,
          .login-network-node-glow,
          .login-network-node-symbol {
            transition:
              opacity 70ms linear,
              stroke-width 80ms ease-out,
              stroke-opacity 80ms ease-out,
              fill-opacity 70ms linear;
            transform-box: fill-box;
            transform-origin: center;
          }

          .login-node-peek-panel {
            transition: opacity 40ms linear;
          }

          .login-network-edge[data-muted="true"] {
            opacity: 0.48;
          }

          .login-network-node[data-active="true"] {
            opacity: 1;
          }

          .login-network-node[data-neighbor="true"] {
            opacity: 0.88;
          }

          .login-network-node[data-muted="true"] {
            opacity: 0.54;
          }

          .login-network-hit {
            cursor: pointer;
            outline: none;
            pointer-events: all;
          }

          .login-network-hit:focus-visible {
            opacity: 0.46;
            stroke: ${HUD_YELLOW};
            stroke-width: 2.2;
          }

          @media (prefers-reduced-motion: reduce) {
            .login-signal-pulse {
              animation: none;
              opacity: 0.18;
              stroke-dasharray: 0.04 0.96;
            }

            .login-network-edge,
            .login-network-node,
            .login-network-node-glow,
            .login-network-node-symbol,
            .login-node-peek-panel {
              transition: none;
            }
          }
        `}
      </style>
      <radialGradient id="jadsGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={HUD_CYAN} stopOpacity="var(--login-glow-opacity)" />
        <stop offset="100%" stopColor={HUD_CYAN} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="jadsGlowWarm" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={HUD_YELLOW} stopOpacity="var(--login-glow-warm-opacity)" />
        <stop offset="100%" stopColor={HUD_YELLOW} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="neoNodeSurface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--login-node-highlight)" stopOpacity="0.55" />
        <stop offset="46%" stopColor="var(--login-node-surface)" stopOpacity="0.94" />
        <stop offset="100%" stopColor="var(--login-node-shadow)" stopOpacity="0.22" />
      </linearGradient>
      <filter id="neoNodeRaised" x="-90%" y="-90%" width="280%" height="280%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="2.2" dy="2.2" stdDeviation="2.4" floodColor="var(--login-node-shadow)" floodOpacity="0.82" />
        <feDropShadow dx="-2.2" dy="-2.2" stdDeviation="2.4" floodColor="var(--login-node-highlight)" floodOpacity="0.78" />
      </filter>
      <linearGradient id="neoSymbolSurface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--login-symbol-highlight)" stopOpacity="0.74" />
        <stop offset="48%" stopColor="var(--login-symbol-fill)" stopOpacity="0.96" />
        <stop offset="100%" stopColor="var(--login-symbol-shadow)" stopOpacity="0.34" />
      </linearGradient>
      <linearGradient id="neoSymbolWarmSurface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.78)" stopOpacity="0.66" />
        <stop offset="52%" stopColor="var(--login-symbol-warm-fill)" stopOpacity="0.94" />
        <stop offset="100%" stopColor="var(--login-symbol-shadow)" stopOpacity="0.26" />
      </linearGradient>
      <filter id="neoSymbolRaised" x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="0.75" dy="0.75" stdDeviation="0.85" floodColor="var(--login-symbol-shadow)" floodOpacity="0.66" />
        <feDropShadow dx="-0.65" dy="-0.65" stdDeviation="0.7" floodColor="var(--login-symbol-highlight)" floodOpacity="0.54" />
      </filter>
    </defs>

    {EDGES.map(([a, b], i) => {
      const start = NODES[a];
      const end = NODES[b];
      if (!start || !end) return null;
      const isActiveEdge = activeNodeIndex !== null && (a === activeNodeIndex || b === activeNodeIndex);
      const isMutedEdge = activeNodeIndex !== null && !isActiveEdge;
      return (
        <line
          key={`edge-${i}`}
          data-testid="network-edge"
          className="login-network-edge"
          data-active={isActiveEdge ? 'true' : 'false'}
          data-muted={isMutedEdge ? 'true' : 'false'}
          x1={start.cx}
          y1={start.cy}
          x2={end.cx}
          y2={end.cy}
          stroke={isActiveEdge ? HUD_YELLOW : 'var(--login-edge-stroke)'}
          strokeOpacity={isActiveEdge ? 0.76 : 'var(--login-edge-opacity)'}
          strokeWidth={isActiveEdge ? 2.2 : 1.1}
          strokeLinecap="round"
        />
      );
    })}

    {/* Feeder edges: inner ring (nodes 0..7) -> panel center (410, 250).
        Paper sits on top with zIndex 2, so lines naturally terminate at the
        panel border, making the login card look like the central C2 node. */}
    {NODES.slice(0, 8).map((n, i) => (
      <line
        key={`feeder-${i}`}
        x1={n.cx}
        y1={n.cy}
        x2={410}
        y2={250}
        stroke={HUD_CYAN}
        strokeOpacity="var(--login-edge-opacity)"
        strokeWidth={1.2}
        strokeDasharray="3 2"
      />
    ))}

    {NODES.slice(0, 8).map((n, i) => (
      <line
        key={`signal-${i}`}
        data-testid="network-signal-pulse"
        className={`login-signal-pulse login-signal-pulse-${i % 4}`}
        x1={n.cx}
        y1={n.cy}
        x2={410}
        y2={250}
        pathLength={1}
        stroke={HUD_YELLOW}
        strokeOpacity={0.78}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    ))}

    {NODES.map((n, i) => {
      const isActiveNode = activeNodeIndex === i;
      const isNeighborNode = activeConnectedNodeIndexes.has(i);
      const isMutedNode = activeNodeIndex !== null && !isActiveNode && !isNeighborNode;
      const glowId = n.kind === 'cmd' ? 'jadsGlowWarm' : 'jadsGlow';
      const glowR = n.kind === 'cmd' ? 28 : 22;
      const nodeSurfaceR = n.kind === 'cmd' ? 19 : 16.5;
      const labelY = n.cy > 400 ? n.cy - 17 : n.cy + 22;
      return (
        <g
          key={`node-${i}`}
          className="login-network-node"
          data-node-style="neumorphic"
          data-active={isActiveNode ? 'true' : 'false'}
          data-neighbor={isNeighborNode ? 'true' : 'false'}
          data-muted={isMutedNode ? 'true' : 'false'}
        >
          <circle
            className="login-network-node-glow"
            cx={n.cx}
            cy={n.cy}
            r={isActiveNode ? glowR + 8 : isNeighborNode ? glowR + 3 : glowR}
            fill={`url(#${isActiveNode ? 'jadsGlowWarm' : glowId})`}
            opacity={isMutedNode ? 0.72 : 1}
          />
          <circle
            data-testid="network-node-depth"
            cx={n.cx + 1.8}
            cy={n.cy + 1.8}
            r={isActiveNode ? nodeSurfaceR + 1.2 : n.kind === 'cmd' ? 19.4 : 16.9}
            fill="none"
            stroke="var(--login-node-shadow)"
            strokeOpacity={isActiveNode ? 0.34 : 0.22}
            strokeWidth={isActiveNode ? 2.8 : 2.2}
            filter="url(#neoNodeRaised)"
          />
          <circle
            data-testid="network-node-surface"
            cx={n.cx}
            cy={n.cy}
            r={isActiveNode ? nodeSurfaceR + 1.5 : nodeSurfaceR}
            fill="url(#neoNodeSurface)"
            stroke={isActiveNode ? HUD_YELLOW : 'var(--login-node-rim)'}
            strokeWidth={isActiveNode ? 1.15 : 0.55}
            filter="url(#neoNodeRaised)"
          />
          <circle
            cx={n.cx - 2.2}
            cy={n.cy - 2.2}
            r={n.kind === 'cmd' ? 13.8 : 11.8}
            fill="none"
            stroke="var(--login-node-highlight)"
            strokeOpacity={0.3}
            strokeWidth={0.9}
          />
          <g
            data-testid="network-node-symbol"
            className="login-network-node-symbol"
            data-symbol-style="neumorphic"
            data-symbol-language="tactical-glyphs"
            filter="url(#neoSymbolRaised)"
            opacity={isMutedNode ? 0.72 : 'var(--login-symbol-opacity)'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {renderIcon(n.kind, n.cx, n.cy)}
          </g>
          <text
            x={n.cx}
            y={labelY}
            textAnchor="middle"
            fill={HUD_CYAN}
            fillOpacity={isActiveNode ? 0.84 : isMutedNode ? 0.34 : 0.55}
            fontSize={6.5}
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            {n.label}
          </text>
          <circle
            data-testid="network-node-hit"
            className="login-network-hit"
            cx={n.cx}
            cy={n.cy}
            r={Math.max(28, nodeSurfaceR + 7)}
            fill="transparent"
            stroke="transparent"
            opacity={0}
            role="button"
            tabIndex={0}
            aria-label={getNodeAriaLabel(i)}
            pointerEvents="all"
            onPointerEnter={() => activateNode(i)}
            onPointerLeave={clearActiveNode}
            onFocus={() => activateNode(i)}
            onBlur={clearActiveNode}
            onPointerDown={(event) => {
              if (event.pointerType !== 'mouse') activateNode(i);
            }}
            onPointerUp={(event) => {
              if (event.pointerType !== 'mouse') {
                window.setTimeout(() => {
                  setActiveNodeIndex((currentIndex) => (currentIndex === i ? null : currentIndex));
                }, 1200);
              }
            }}
            onPointerCancel={clearActiveNode}
          />
        </g>
      );
    })}

    {activeNode && activePanelPosition && (
      <g
        data-testid="network-node-peek-panel"
        className="login-node-peek-panel"
        transform={`translate(${activePanelPosition.x}, ${activePanelPosition.y})`}
        pointerEvents="none"
      >
        <rect
          data-testid="network-node-peek-frame"
          width={NODE_PEEK_PANEL_WIDTH}
          height={NODE_PEEK_PANEL_HEIGHT}
          rx={4}
          fill="var(--login-control-bg)"
          fillOpacity={0.94}
          stroke={HUD_YELLOW}
          strokeOpacity={0.68}
          strokeWidth={0.65}
          filter="url(#neoNodeRaised)"
        />
        <rect x={5} y={5} width={1.5} height={12} rx={0.75} fill={HUD_YELLOW} fillOpacity={0.86} />
        <text x={9} y={9} fill={HUD_TEXT} fontSize={5.4} fontWeight={700} fontFamily="monospace">
          {activeNode.label}
        </text>
        <text x={9} y={15} fill={HUD_CYAN} fillOpacity={0.78} fontSize={3.8} fontFamily="monospace">
          {NODE_KIND_LABELS[activeNode.kind]}
        </text>
        <text x={9} y={19.2} fill={HUD_TEXT} fillOpacity={0.68} fontSize={3.2} fontFamily="monospace">
          {`Bagli: ${activeNodeConnectionLabels.length}`}
        </text>
      </g>
    )}
    </Box>
  );
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [themeId, setThemeId] = useState<LoginThemeId>('tactical-neo');
  const theme = LOGIN_THEME_BY_ID[themeId];
  const isTacticalTheme = themeId === 'tactical-neo';
  const nextThemeId: LoginThemeId = isTacticalTheme ? 'soft-command' : 'tactical-neo';
  const themeToggleLabel = isTacticalTheme ? 'Açık temaya geç' : 'Koyu temaya geç';
  const themeToggleTitle = `${LOGIN_THEME_BY_ID[nextThemeId].label} temasına geç`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    dispatch(shellActions.authLoading());
    try {
      const { accessToken } = await authApi.login(username, password);
      try {
        localStorage.setItem(shellConfig.jwtStorageKey, accessToken);
      } catch {
        /* storage might be blocked - we still hold the token in memory */
      }
      const me = await authApi.me(accessToken);
      dispatch(
        shellActions.authSuccess({
          token: accessToken,
          user: { id: me.userId, username: me.username, permissions: me.permissions },
        }),
      );
      navigate({ to: '/' });
    } catch (err) {
      dispatch(shellActions.authFail());
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      data-visual-style={themeId}
      style={theme.cssVars}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        px: 2,
        pt: { xs: 11, sm: 14 },
        pb: { xs: 5, sm: 14 },
        overflowX: 'hidden',
        overflowY: 'auto',
        color: NEO_TEXT,
        bgcolor: NEO_SURFACE,
        backgroundColor: NEO_SURFACE,
        backgroundImage: theme.rootBackgroundImage,
        backgroundSize: theme.rootBackgroundSize,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: theme.overlayBackgroundImage,
          backgroundSize: '32px 32px, 22px 22px, 22px 22px',
        }}
      />

      <NetworkBackdrop />

      <Tooltip title={themeToggleTitle} arrow>
        <IconButton
          type="button"
          aria-label={themeToggleLabel}
          aria-pressed={isTacticalTheme}
          onClick={() => setThemeId(nextThemeId)}
          sx={{
            position: 'absolute',
            top: { xs: 18, sm: 32 },
            right: { xs: 16, sm: 48 },
            zIndex: 3,
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: NEO_SURFACE,
            color: isTacticalTheme ? HUD_YELLOW : HUD_CYAN_HOVER,
            border: 'var(--login-brand-border)',
            boxShadow: NEO_SHADOW_SOFT,
            '&:hover': {
              bgcolor: 'var(--login-selection-bg)',
              color: NEO_TEXT,
            },
            '&.Mui-focusVisible': {
              outline: '2px solid var(--login-field-focus)',
              outlineOffset: 3,
            },
          }}
        >
          {isTacticalTheme ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          position: 'absolute',
          top: { xs: 24, sm: 36 },
          left: { xs: 24, sm: 48 },
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 34, sm: 46 },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: 0,
            color: NEO_TEXT,
            textShadow: 'var(--login-top-title-shadow)',
          }}
        >
          Mil JAD-S
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          display: { xs: 'none', md: 'block' },
          bottom: { xs: 24, sm: 36 },
          left: { xs: 24, sm: 48 },
          maxWidth: 380,
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 13, sm: 15 },
            fontWeight: 800,
            color: NEO_TEXT,
            letterSpacing: 0.2,
            mb: 0.6,
          }}
        >
          Mil JAD-S
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: 11, sm: 13 },
            lineHeight: 1.55,
            color: NEO_TEXT_MUTED,
          }}
        >
          Mil JAD-S delivers integrated, multi-domain situational awareness by
          fusing sensor feeds across land, sea, air, space and cyber assets
          into a single, resilient operational picture for joint command and
          control.
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          display: { xs: 'none', sm: 'block' },
          bottom: { xs: 24, sm: 36 },
          right: { xs: 24, sm: 48 },
          zIndex: 1,
        }}
      >
        <Box
          role="img"
          aria-label="FORTE MILSOFT"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.15,
            bgcolor: NEO_SURFACE,
            border: 'var(--login-brand-border)',
            px: 1.4,
            py: 0.65,
            boxShadow: NEO_SHADOW_SOFT,
            borderRadius: '10px',
          }}
        >
          {/* forte — red “o” + slash; scaled up vs MilSOFT */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: { xs: 15, sm: 17 },
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: NEO_TEXT,
              fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
              lineHeight: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: { xs: 21, sm: 24 },
                fontWeight: 700,
                lineHeight: 1,
                display: 'inline-block',
                mr: '-0.02em',
              }}
            >
              F
            </Box>
            <Box
              component="span"
              sx={{
                position: 'relative',
                width: 17,
                height: 17,
                mx: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 15,
                  height: 15,
                  borderRadius: '50%',
                  bgcolor: HUD_RED,
                  boxShadow: 'var(--login-red-mark-shadow)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: 20,
                  height: 2.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.95)',
                  transform: 'rotate(-48deg)',
                  boxShadow: '0 0 1px rgba(0,0,0,0.4)',
                }}
              />
            </Box>
            <Box component="span">RTE</Box>
          </Box>
          <Box
            sx={{
              width: '1px',
              alignSelf: 'stretch',
              minHeight: 22,
              bgcolor: NEO_LINE,
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              fontSize: { xs: 12, sm: 13.5 },
              fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
              lineHeight: 1,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <Box component="span" sx={{ color: HUD_RED, fontStyle: 'normal', fontWeight: 800 }}>
              Mil
            </Box>
            <Box
              component="span"
              sx={{ color: HUD_CYAN_HOVER, letterSpacing: '0.14em', fontStyle: 'normal', ml: '2px' }}
            >
              SOFT
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        data-testid="login-panel-frame"
        data-panel-scale="browser-125"
        sx={{
          position: 'relative',
          zIndex: 2,
          width: { xs: 'min(calc(100vw - 32px), 368px)', sm: '348px' },
          minHeight: { xs: 404, sm: 'auto' },
          aspectRatio: { xs: 'auto', sm: '1' },
          maxWidth: 'calc(100vw - 32px)',
          flexShrink: 0,
          transform: { xs: 'none', sm: 'scale(1.25)' },
          transformOrigin: 'center center',
        }}
      >
        {/* Outer halo — matches SVG node glow (jadsGlow: cyan ~55% core fading to transparent) */}
        <Box
          data-testid="login-panel-shadow"
          data-shadow-only="true"
          aria-hidden
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '102%', sm: '122%' },
            height: { xs: '102%', sm: '122%' },
            borderRadius: { xs: '32px', sm: '50%' },
            background: 'transparent',
            boxShadow: 'var(--login-panel-halo-shadow)',
            opacity: { xs: 0.58, sm: 'var(--login-panel-halo-opacity)' },
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Secondary warm rim like node accent */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '100%', sm: '104%' },
            height: { xs: '100%', sm: '104%' },
            borderRadius: { xs: '28px', sm: '50%' },
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

      <Paper
        data-testid="login-panel"
        data-panel-shape="responsive-roundrect-circle"
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: { xs: 'auto', sm: '100%' },
          minHeight: { xs: 404, sm: 'auto' },
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          pt: { xs: '58px', sm: '34px' },
          pb: { xs: '30px', sm: '18px' },
          px: { xs: '24px', sm: '20px' },
          borderRadius: { xs: '28px', sm: '50%' },
          overflow: 'hidden',
          border: 'var(--login-paper-border)',
          bgcolor: NEO_SURFACE,
          color: HUD_TEXT,
          boxShadow: `${NEO_SHADOW_RAISED}, inset 1px 1px 0 ${NEO_SURFACE_LIGHT}, inset -1px -1px 0 ${NEO_SURFACE_DARK}`,
          backdropFilter: 'none',
        }}
      >
        {/* Globe: img + center scale clips side letterboxing; fallback matches ocean glow (not black) */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: { xs: '28px', sm: '50%' },
            overflow: 'hidden',
            zIndex: 0,
            pointerEvents: 'none',
            bgcolor: NEO_SURFACE,
            background: 'var(--login-globe-bg)',
          }}
        >
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}login-globe-bg.png`}
            alt=""
            draggable={false}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '100%',
              height: '100%',
              transform: 'translate(-50%, -50%) scale(2.35, 2.12)',
              objectFit: 'cover',
              objectPosition: 'center center',
              userSelect: 'none',
              opacity: 'var(--login-globe-opacity)',
              filter: 'var(--login-globe-filter)',
            }}
          />
        </Box>

        {/* Node-id strip */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 22,
            right: 22,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: 9,
            letterSpacing: 0.8,
            color: NEO_TEXT_MUTED,
            textShadow: 'var(--login-node-strip-shadow)',
            pointerEvents: 'none',
          }}
        >
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                bgcolor: NEO_ACCENT,
                boxShadow: `2px 2px 4px ${NEO_SURFACE_DARK}, -2px -2px 4px ${NEO_SURFACE_LIGHT}`,
              }}
            />
            C2-CMD-00
          </Box>
          <Box component="span" sx={{ color: NEO_TEXT_MUTED }}>JAD-S//CORE</Box>
        </Box>

        <Stack
          component="form"
          onSubmit={submit}
          spacing={1}
          sx={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            width: '100%',
            maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX },
            minHeight: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: '100%',
              maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX },
              pt: 0.25,
              pb: 0.65,
              borderBottom: `1px solid ${NEO_LINE}`,
              textAlign: 'center',
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 18, sm: 21 },
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 2,
                color: HUD_TITLE,
                textShadow: 'var(--login-title-shadow)',
              }}
            >
              Mil JAD-S
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                py: 0.25,
                borderRadius: '10px',
                width: '100%',
                maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX },
                bgcolor: 'var(--login-error-bg)',
                border: 'var(--login-error-border)',
                color: 'var(--login-error-color)',
                boxShadow: NEO_SHADOW_INSET,
                '& .MuiAlert-icon': { color: '#ef5350' },
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            label="Kullanıcı adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            fullWidth
            variant="outlined"
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
            }}
            sx={[loginFieldSx, { width: '100%', maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX } }]}
          />
          <TextField
            label="Parola"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                      onClick={() => setShowPassword((visible) => !visible)}
                      edge="end"
                      size="small"
                      sx={{ color: NEO_TEXT_MUTED }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={[loginFieldSx, { width: '100%', maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX } }]}
          />

          <Stack direction="row" justifyContent="center" sx={{ width: '100%', maxWidth: { xs: 280, sm: LOGIN_PANEL_CONTENT_MAX } }}>
            <Button
              type="submit"
              variant="contained"
              disabled={busy}
              sx={{
                width: { xs: 188, sm: 176 },
                maxWidth: '100%',
                minHeight: 44,
                borderRadius: '12px',
                bgcolor: HUD_YELLOW,
                color: NEO_CTA_TEXT,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0,
                textTransform: 'none',
                boxShadow: `5px 5px 10px ${NEO_SURFACE_DARK}, -5px -5px 10px ${NEO_SURFACE_LIGHT}`,
                '&:hover': {
                  bgcolor: NEO_ACCENT_HOVER,
                  color: NEO_CTA_TEXT,
                  boxShadow: `7px 7px 12px ${NEO_SURFACE_DARK}, -7px -7px 12px ${NEO_SURFACE_LIGHT}`,
                },
                '&:active': {
                  boxShadow: NEO_SHADOW_INSET,
                },
                '&.Mui-focusVisible': {
                  outline: '2px solid var(--login-field-focus)',
                  outlineOffset: 3,
                },
                '&.Mui-disabled': {
                  bgcolor: 'color-mix(in srgb, var(--login-accent) 44%, var(--login-surface))',
                  color: NEO_TEXT_MUTED,
                  boxShadow: NEO_SHADOW_INSET,
                },
              }}
            >
              {busy ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      </Box>
    </Box>
  );
}
