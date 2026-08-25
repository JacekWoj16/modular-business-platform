import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLayoutStore } from '../../stores/layout.store';
import { useModulesStore } from '../../stores/modules.store';

/** Dropdown listing hidden panels, to bring one back onto the dashboard. */
export function PanelToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useLayoutStore((s) => s.items);
  const toggleVisibility = useLayoutStore((s) => s.toggleVisibility);
  const modules = useModulesStore((s) => s.enabledModules);

  const panelNames = new Map<string, string>();
  for (const module of modules) {
    for (const panel of module.panels) {
      panelNames.set(panel.id, panel.name);
    }
  }

  const hidden = items.filter((item) => !item.isVisible && panelNames.has(item.panelId));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
      >
        <Plus size={14} /> Add panel{hidden.length > 0 ? ` (${hidden.length} hidden)` : ''}
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded border border-slate-200 bg-white py-1 text-slate-900 shadow-lg">
          {hidden.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-slate-400">All panels are visible.</p>
          ) : (
            hidden.map((item) => (
              <button
                key={item.panelId}
                onClick={() => {
                  void toggleVisibility(item.panelId);
                  setIsOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50"
              >
                {panelNames.get(item.panelId)}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
