import { getModuleIcon } from '../../core/icons';
import { useModulesStore } from '../../stores/modules.store';

/**
 * The one panel that's always present and can't be hidden: a fixed sidebar
 * with an icon per enabled module. Clicking a module filters the dashboard
 * to that module's panels; clicking the active one again clears the filter.
 */
export function ModuleNavigator() {
  const modules = useModulesStore((s) => s.enabledModules);
  const activeModuleId = useModulesStore((s) => s.activeModuleId);
  const setActiveModule = useModulesStore((s) => s.setActiveModule);

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-2 bg-slate-800 py-3">
      {modules.map((module) => {
        const Icon = getModuleIcon(module.icon);
        const isActive = activeModuleId === module.id;
        return (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            title={module.name}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </nav>
  );
}
