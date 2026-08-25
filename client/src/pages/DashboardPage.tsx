import { useEffect } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { ModuleNavigator } from '../components/layout/ModuleNavigator';
import { Dashboard } from '../components/layout/Dashboard';
import { PanelToolbar } from '../components/layout/PanelToolbar';
import { useAuthStore } from '../stores/auth.store';
import { useModulesStore } from '../stores/modules.store';
import { useLayoutStore } from '../stores/layout.store';
import '../core/panel-manifest';

export function DashboardPage() {
  const enabledModuleIds = useAuthStore((s) => s.enabledModuleIds);
  const fetchModules = useModulesStore((s) => s.fetchModules);
  const fetchLayout = useLayoutStore((s) => s.fetchLayout);

  useEffect(() => {
    void fetchModules(enabledModuleIds).then(() => fetchLayout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledModuleIds]);

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ModuleNavigator />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 justify-end border-b border-slate-800 p-2">
            <PanelToolbar />
          </div>
          <div className="flex-1 overflow-auto bg-slate-900 p-3">
            <Dashboard />
          </div>
        </div>
      </div>
    </div>
  );
}
