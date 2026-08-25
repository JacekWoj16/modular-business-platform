const TOKEN_STORAGE_KEY = 'modular_app_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't survive a reload.
  }
}

/**
 * Shared fetch wrapper: attaches the stored JWT (if any) as a Bearer token
 * and normalizes error responses into a thrown Error. Used directly by
 * auth/layout calls, and wrapped again by useModuleApi for module routes.
 */
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
