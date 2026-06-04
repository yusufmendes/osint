import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import LoginPage from '../src/auth/LoginPage';
import { shellReducer } from '../src/store/shellSlice';
import { authApi } from '../src/auth/authApi';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../src/auth/authApi', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

function renderLoginPage() {
  const store = configureStore({
    reducer: {
      shell: shellReducer,
    },
  });

  return render(
    <Provider store={store}>
      <LoginPage />
    </Provider>,
  );
}

describe('LoginPage', () => {
  it('renders the tactical neo variant by default without changing the login contract', () => {
    const { container } = renderLoginPage();

    expect(container.querySelector('[data-visual-style="tactical-neo"]')).toBeInTheDocument();
    expect(screen.getAllByText('Mil JAD-S').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/kullanıcı adı/i)).toHaveValue('admin');
    expect(screen.getByDisplayValue('admin123')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.queryByRole('button', { name: /passkey|geçiş anahtarı/i })).not.toBeInTheDocument();
  });

  it('uses a single accessible icon-only theme toggle', () => {
    const { container } = renderLoginPage();

    const themeToggle = screen.getByRole('button', { name: /açık temaya geç/i });

    expect(screen.queryByRole('group', { name: /login tema seçimi/i })).not.toBeInTheDocument();
    expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /soft command/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tactical neo/i })).not.toBeInTheDocument();

    fireEvent.click(themeToggle);

    expect(container.querySelector('[data-visual-style="soft-command"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /koyu temaya geç/i })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: /koyu temaya geç/i }));

    expect(container.querySelector('[data-visual-style="tactical-neo"]')).toBeInTheDocument();
  });

  it('uses black CTA text in the tactical neo theme for contrast', () => {
    const { container } = renderLoginPage();

    const tacticalRoot = container.querySelector('[data-visual-style="tactical-neo"]') as HTMLElement;
    expect(tacticalRoot.style.getPropertyValue('--login-cta-text')).toBe('#0a1216');
  });

  it('keeps tactical text field focus border in the existing cyan border family', () => {
    const { container } = renderLoginPage();

    const tacticalRoot = container.querySelector('[data-visual-style="tactical-neo"]') as HTMLElement;
    expect(tacticalRoot.style.getPropertyValue('--login-field-focus-border')).toBe('rgba(126, 227, 255, 0.52)');
    expect(tacticalRoot.style.getPropertyValue('--login-focus-ring')).toBe('rgba(126, 227, 255, 0.16)');
  });

  it('shows localized loading copy while submitting the existing username and password flow', async () => {
    let resolveLogin!: (value: { accessToken: string; expiresIn: number }) => void;
    vi.mocked(authApi.login).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    vi.mocked(authApi.me).mockResolvedValueOnce({
      userId: '1',
      username: 'admin',
      permissions: [],
    });

    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));

    expect(await screen.findByRole('button', { name: /giriş yapılıyor/i })).toBeDisabled();

    await act(async () => {
      resolveLogin({ accessToken: 'token', expiresIn: 60 });
    });
  });

  it('keeps the login panel outer effect as shadow only', () => {
    renderLoginPage();

    expect(screen.getByTestId('login-panel-frame')).toHaveAttribute('data-panel-scale', 'browser-125');
    expect(screen.getByTestId('login-panel-shadow')).toHaveAttribute('data-shadow-only', 'true');
    expect(screen.getByTestId('login-panel')).toHaveAttribute('data-panel-shape', 'responsive-roundrect-circle');
  });

  it('renders network nodes with neumorphic depth styling', () => {
    const { container } = renderLoginPage();

    expect(screen.getByTestId('network-backdrop')).toHaveAttribute('data-node-style', 'neumorphic');
    const surfaces = screen.getAllByTestId('network-node-surface');
    expect(surfaces.length).toBeGreaterThan(0);
    expect(surfaces[0]).toHaveAttribute('stroke-width', '0.55');
    expect(screen.getAllByTestId('network-node-depth').length).toBe(surfaces.length);

    const tacticalRoot = container.querySelector('[data-visual-style="tactical-neo"]') as HTMLElement;
    expect(tacticalRoot.style.getPropertyValue('--login-node-rim')).toBe('rgba(126, 227, 255, 0.13)');
  });

  it('renders network node symbols with neumorphic styling', () => {
    const { container } = renderLoginPage();

    expect(screen.getByTestId('network-backdrop')).toHaveAttribute('data-symbol-style', 'neumorphic');
    const symbols = screen.getAllByTestId('network-node-symbol');
    const surfaces = screen.getAllByTestId('network-node-surface');
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols).toHaveLength(surfaces.length);
    expect(symbols[0]).toHaveAttribute('data-symbol-language', 'tactical-glyphs');
    expect(symbols[0]).toHaveAttribute('filter', 'url(#neoSymbolRaised)');

    const tacticalRoot = container.querySelector('[data-visual-style="tactical-neo"]') as HTMLElement;
    expect(tacticalRoot.style.getPropertyValue('--login-symbol-stroke')).toBe('rgba(126, 227, 255, 0.7)');
  });

  it('adds purposeful signal motion with a reduced-motion CSS guard', () => {
    renderLoginPage();

    expect(screen.getByTestId('network-backdrop')).toHaveAttribute('data-motion', 'signal-flow');
    expect(screen.getAllByTestId('network-signal-pulse').length).toBeGreaterThan(0);
    expect(screen.getByTestId('network-backdrop')).toHaveAttribute('data-reduced-motion', 'css-media');
  });

  it('reveals a node peek panel on hover and clears it on leave', () => {
    renderLoginPage();

    const backdrop = screen.getByTestId('network-backdrop');
    const hitTargets = screen.getAllByTestId('network-node-hit');

    expect(backdrop).toHaveAttribute('data-interaction', 'node-peek');
    expect(backdrop).toHaveAttribute('data-hover-profile', 'instant-tactical');
    expect(hitTargets).toHaveLength(screen.getAllByTestId('network-node-surface').length);
    expect(hitTargets[0]).toHaveAttribute('r', '28');

    fireEvent.pointerEnter(hitTargets[0]!);

    expect(backdrop).toHaveAttribute('data-active-node', 'SAT-01');
    expect(screen.getAllByTestId('network-edge').some((edge) => edge.getAttribute('data-active') === 'true')).toBe(true);

    const peekPanel = screen.getByTestId('network-node-peek-panel');
    const peekFrame = screen.getByTestId('network-node-peek-frame');
    expect(peekPanel).toHaveAttribute('transform', 'translate(381, 40)');
    expect(peekFrame).toHaveAttribute('width', '58');
    expect(peekFrame).toHaveAttribute('height', '22');
    expect(within(peekPanel).getByText('SAT-01')).toBeInTheDocument();

    fireEvent.pointerLeave(hitTargets[0]!);

    expect(backdrop).not.toHaveAttribute('data-active-node');
    expect(screen.queryByTestId('network-node-peek-panel')).not.toBeInTheDocument();
  });

  it('supports keyboard focus for node peek and clears it on blur', () => {
    renderLoginPage();

    const backdrop = screen.getByTestId('network-backdrop');
    const firstHitTarget = screen.getAllByTestId('network-node-hit')[0]!;

    fireEvent.focus(firstHitTarget);

    expect(backdrop).toHaveAttribute('data-active-node', 'SAT-01');
    expect(screen.getByTestId('network-node-peek-panel')).toBeInTheDocument();

    fireEvent.blur(firstHitTarget);

    expect(backdrop).not.toHaveAttribute('data-active-node');
    expect(screen.queryByTestId('network-node-peek-panel')).not.toBeInTheDocument();
  });
});
