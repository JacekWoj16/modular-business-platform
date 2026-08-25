import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../core/api-client';
import { useAuthStore } from '../stores/auth.store';
import { useModulesStore } from '../stores/modules.store';
import { useLayoutStore } from '../stores/layout.store';

interface ToggleResponse {
  enabledModuleIds: string[];
  autoEnabled: string[];
}

/** Module enable/disable toggles, and a layout reset button. */
export function SettingsPage() {
  const allModules = useModulesStore((s) => s.allModules);
  const fetchModules = useModulesStore((s) => s.fetchModules);
  const enabledModuleIds = useAuthStore((s) => s.enabledModuleIds);
  const setEnabledModuleIds = useAuthStore((s) => s.setEnabledModuleIds);
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    void fetchModules(enabledModuleIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleModule(moduleId: string, enabled: boolean): Promise<void> {
    const result = await apiRequest<ToggleResponse>(`/api/auth/modules/${moduleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    setEnabledModuleIds(result.enabledModuleIds);
    await fetchModules(result.enabledModuleIds);
    setNotice(
      result.autoEnabled.length > 0
        ? `Also enabled: ${result.autoEnabled.join(', ')} (${moduleId} depends on it).`
        : null,
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 text-slate-900 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Settings</h1>
          <Link to="/dashboard" className="text-xs text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </div>

        <h2 className="mb-2 text-sm font-medium text-slate-600">Modules</h2>
        <div className="flex flex-col gap-2">
          {allModules.map((module) => {
            const enabled = enabledModuleIds.includes(module.id);
            return (
              <label
                key={module.id}
                className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{module.name}</p>
                  <p className="text-xs text-slate-500">{module.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => void toggleModule(module.id, e.target.checked)}
                />
              </label>
            );
          })}
        </div>
        {notice ? <p className="mt-3 text-xs text-blue-600">{notice}</p> : null}

        <h2 className="mb-2 mt-6 text-sm font-medium text-slate-600">Layout</h2>
        <button
          onClick={() => {
            void resetLayout().then(() => {
              setResetDone(true);
              setTimeout(() => setResetDone(false), 2000);
            });
          }}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Reset Layout
        </button>
        {resetDone ? <span className="ml-2 text-xs text-green-600">Done.</span> : null}
      </div>
    </div>
  );
}
