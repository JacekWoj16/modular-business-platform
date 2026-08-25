import { create } from 'zustand';
import { apiRequest, getStoredToken, setStoredToken } from '../core/api-client';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: { id: number; username: string; fullName: string; role: string };
}

interface MeResponse {
  user: AuthUser;
  enabledModuleIds: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  enabledModuleIds: string[];
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Restores the session from a stored token — called once on app boot. */
  restoreSession: () => Promise<void>;
  setEnabledModuleIds: (ids: string[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getStoredToken(),
  user: null,
  enabledModuleIds: [],
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setStoredToken(result.token);
      const me = await apiRequest<MeResponse>('/api/auth/me');
      set({ token: result.token, user: me.user, enabledModuleIds: me.enabledModuleIds, isLoading: false });
    } catch (err) {
      setStoredToken(null);
      set({ isLoading: false, token: null, error: err instanceof Error ? err.message : 'Login failed' });
      throw err;
    }
  },

  logout: () => {
    setStoredToken(null);
    set({ token: null, user: null, enabledModuleIds: [] });
  },

  restoreSession: async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const me = await apiRequest<MeResponse>('/api/auth/me');
      set({ token, user: me.user, enabledModuleIds: me.enabledModuleIds });
    } catch {
      // Token expired/invalid — drop it, ProtectedRoute sends the user back to /login.
      setStoredToken(null);
      set({ token: null, user: null, enabledModuleIds: [] });
    }
  },

  setEnabledModuleIds: (ids) => set({ enabledModuleIds: ids }),
}));
