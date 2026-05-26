import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, type UserOut, type RegisterPayload } from '../api/client';

function _jwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ email: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// TODO: migrate to httpOnly cookies (requires backend Set-Cookie + credentials:'include' on all API calls + CSRF token)
const ACCESS_KEY = 'rwa_access_token';
const REFRESH_KEY = 'rwa_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
    isLoading: true,
  });
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const _scheduleRefresh = useCallback((accessToken: string, refreshToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const exp = _jwtExp(accessToken);
    if (!exp) return;
    const msUntilRefresh = (exp * 1000) - Date.now() - 5 * 60 * 1000; // 5 min before expiry
    if (msUntilRefresh <= 0) return;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const tokens = await authApi.refresh(refreshToken);
        _saveTokens(tokens.access_token, tokens.refresh_token);
        setState((s) => ({ ...s, accessToken: tokens.access_token, refreshToken: tokens.refresh_token }));
        _scheduleRefresh(tokens.access_token, tokens.refresh_token);
      } catch {
        _clearStorage();
        setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
      }
    }, msUntilRefresh);
  }, []);

  // On mount: validate stored access token
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authApi
      .me(token)
      .then((user) => {
        const rt = localStorage.getItem(REFRESH_KEY) ?? '';
        setState((s) => ({ ...s, user, accessToken: token, isLoading: false }));
        _scheduleRefresh(token, rt);
      })
      .catch(async () => {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) {
          _clearStorage();
          setState((s) => ({ ...s, user: null, accessToken: null, refreshToken: null, isLoading: false }));
          return;
        }
        try {
          const tokens = await authApi.refresh(refreshToken);
          _saveTokens(tokens.access_token, tokens.refresh_token);
          const user = await authApi.me(tokens.access_token);
          setState({ user, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, isLoading: false });
          _scheduleRefresh(tokens.access_token, tokens.refresh_token);
        } catch {
          _clearStorage();
          setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        }
      });
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [_scheduleRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    _saveTokens(tokens.access_token, tokens.refresh_token);
    const user = await authApi.me(tokens.access_token);
    setState({ user, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, isLoading: false });
    _scheduleRefresh(tokens.access_token, tokens.refresh_token);
  }, [_scheduleRefresh]);

  /**
   * Register submits the application. Returns { email } so the caller
   * can redirect to /verify-email-sent. Does NOT auto-login.
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    return { email: res.email };
  }, []);

  const refreshUser = useCallback(async () => {
    const token = state.accessToken;
    if (!token) return;
    const user = await authApi.me(token);
    setState((s) => ({ ...s, user }));
  }, [state.accessToken]);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    _clearStorage();
    setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function _clearStorage() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
