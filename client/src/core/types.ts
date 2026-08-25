export interface PanelDefinition {
  id: string; // e.g. 'sales.orders' — matches the server ModuleDefinition's panel id
  name: string;
  defaultWidth: number;
  defaultHeight: number;
  component: string; // resolved via moduleRegistry.getPanelComponent()
}

/**
 * Mirrors the server's ModuleDefinition shape (minus the Express router,
 * which never leaves the backend). Fetched from GET /api/modules and fed
 * into moduleRegistry.setModules() at app bootstrap.
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  panels: PanelDefinition[];
  dependencies: string[];
}

/** A single panel's saved position/size/visibility, persisted per user. */
export interface LayoutItem {
  panelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isPinned: boolean;
  color?: string;
}
