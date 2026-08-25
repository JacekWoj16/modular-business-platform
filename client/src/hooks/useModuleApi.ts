import { useMemo } from 'react';
import { apiRequest as request } from '../core/api-client';

const API_BASE = '/api/modules';

type QueryValue = string | number | boolean | undefined;

/**
 * Generic REST client scoped to a module's API base path
 * (`/api/modules/<moduleId>`). Panels use this instead of hand-rolling
 * fetch calls, so every module talks to its backend the same way.
 */
export function useModuleApi(moduleId: string) {
  return useMemo(() => {
    const base = `${API_BASE}/${moduleId}`;

    return {
      list: <T>(query?: Record<string, QueryValue>): Promise<T> => {
        const entries = Object.entries(query ?? {}).filter(
          (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
        );
        const search = entries.length > 0
          ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`
          : '';
        return request<T>(`${base}${search}`);
      },
      get: <T>(id: number | string): Promise<T> => request<T>(`${base}/${id}`),
      create: <T>(body: unknown): Promise<T> =>
        request<T>(base, { method: 'POST', body: JSON.stringify(body) }),
      update: <T>(id: number | string, body: unknown): Promise<T> =>
        request<T>(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      remove: (id: number | string): Promise<void> =>
        request<void>(`${base}/${id}`, { method: 'DELETE' }),
      /**
       * For sub-resource actions that don't fit plain REST CRUD, e.g.
       * `PATCH /orders/:id/status` or `POST /orders/:id/invoice`:
       *   salesApi.action(orderId, 'status', 'PATCH', { status: 'confirmed' })
       */
      action: <T>(
        id: number | string,
        subPath: string,
        method: 'POST' | 'PATCH',
        body?: unknown,
      ): Promise<T> =>
        request<T>(`${base}/${id}/${subPath}`, {
          method,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
    };
  }, [moduleId]);
}
