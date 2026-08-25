import RGL, { WidthProvider, type Layout } from 'react-grid-layout';
import { useCallback, useMemo } from 'react';
import { PanelWrapper } from './PanelWrapper';
import { useLayoutStore } from '../../stores/layout.store';
import { useModulesStore } from '../../stores/modules.store';
import { moduleRegistry } from '../../core/module-registry';

const GridLayout = WidthProvider(RGL);

const COLUMNS = 6;
const ROW_HEIGHT = 120;
const GRID_GAP = 12;

interface PanelMeta {
  name: string;
  component: string;
  moduleId: string;
}

/**
 * react-grid-layout container. Renders every visible panel at its persisted
 * position, filtered to the active module if the Module Navigator has one
 * selected. Hiding a panel here only flips `isVisible` in the saved
 * layout — the panel's module keeps working regardless (see docs/architecture.md).
 */
export function Dashboard() {
  const items = useLayoutStore((s) => s.items);
  const saveLayout = useLayoutStore((s) => s.saveLayout);
  const toggleVisibility = useLayoutStore((s) => s.toggleVisibility);
  const togglePin = useLayoutStore((s) => s.togglePin);
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const activeModuleId = useModulesStore((s) => s.activeModuleId);
  const modules = useModulesStore((s) => s.enabledModules);

  const panelMeta = useMemo(() => {
    const map = new Map<string, PanelMeta>();
    for (const module of modules) {
      for (const panel of module.panels) {
        map.set(panel.id, { name: panel.name, component: panel.component, moduleId: module.id });
      }
    }
    return map;
  }, [modules]);

  const visibleItems = items.filter((item) => {
    if (!item.isVisible) return false;
    const meta = panelMeta.get(item.panelId);
    if (!meta) return false;
    return !activeModuleId || meta.moduleId === activeModuleId;
  });

  const gridLayout: Layout[] = visibleItems.map((item) => ({
    i: item.panelId,
    x: item.x,
    y: item.y,
    w: item.width,
    h: item.height,
    static: item.isPinned,
  }));

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // react-grid-layout calls onLayoutChange on every render where the
      // `layout` prop is a new array (which is every render, since we build
      // it fresh above) — not just on an actual drag/resize. Reading the
      // store directly here (instead of closing over the `items` from
      // render scope) guarantees this always starts from the latest saved
      // state, so a redundant/stale call can never clobber a pin or
      // visibility toggle that happened after this callback was created.
      // Only writing back when x/y/w/h actually differ also stops that
      // redundant-call noise from re-PUTting unchanged data on every render.
      const current = useLayoutStore.getState().items;
      let changed = false;
      const updated = current.map((item) => {
        const match = newLayout.find((entry) => entry.i === item.panelId);
        if (!match) return item;
        if (match.x === item.x && match.y === item.y && match.w === item.width && match.h === item.height) {
          return item;
        }
        changed = true;
        return { ...item, x: match.x, y: match.y, width: match.w, height: match.h };
      });
      if (changed) {
        void saveLayout(updated);
      }
    },
    [saveLayout],
  );

  if (visibleItems.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <p className="text-sm">No panels visible.</p>
        <button
          onClick={() => void resetLayout()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Reset Layout
        </button>
      </div>
    );
  }

  return (
    <GridLayout
      className="layout"
      layout={gridLayout}
      cols={COLUMNS}
      rowHeight={ROW_HEIGHT}
      margin={[GRID_GAP, GRID_GAP]}
      draggableHandle=".panel-drag-handle"
      compactType="vertical"
      onLayoutChange={handleLayoutChange}
    >
      {visibleItems.map((item) => {
        const meta = panelMeta.get(item.panelId)!;
        const Component = moduleRegistry.getPanelComponent(meta.component);
        return (
          <div key={item.panelId}>
            <PanelWrapper
              panelId={item.panelId}
              moduleId={meta.moduleId}
              name={meta.name}
              color={item.color ?? undefined}
              isPinned={item.isPinned}
              onTogglePin={() => void togglePin(item.panelId)}
              onClose={() => void toggleVisibility(item.panelId)}
            >
              {Component ? (
                <Component panelId={item.panelId} />
              ) : (
                <p className="p-4 text-xs text-red-500">Unknown panel component: {meta.component}</p>
              )}
            </PanelWrapper>
          </div>
        );
      })}
    </GridLayout>
  );
}
