import { query } from '../database';
import { moduleRegistry } from '../modules/registry';

export interface LayoutItemDTO {
  panelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isPinned: boolean;
  color: string | null;
}

interface LayoutRow {
  panel_id: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  is_visible: boolean;
  is_pinned: boolean;
  color: string | null;
}

function toItem(row: LayoutRow): LayoutItemDTO {
  return {
    panelId: row.panel_id,
    x: row.pos_x,
    y: row.pos_y,
    width: row.width,
    height: row.height,
    isVisible: row.is_visible,
    isPinned: row.is_pinned,
    color: row.color,
  };
}

const GRID_COLUMNS = 6;

/**
 * Auto-arranges panels that don't have a saved layout row yet, packing them
 * left-to-right into a 6-column grid using each panel's default size. Runs
 * on first login (nothing saved) and whenever a newly-enabled module's
 * panels show up with no prior position.
 */
function defaultLayoutFor(panelIds: string[]): LayoutItemDTO[] {
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  const items: LayoutItemDTO[] = [];
  const wanted = new Set(panelIds);

  for (const module of moduleRegistry.list()) {
    for (const panel of module.panels) {
      if (!wanted.has(panel.id)) continue;

      if (x + panel.defaultWidth > GRID_COLUMNS) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
      items.push({
        panelId: panel.id,
        x,
        y,
        width: panel.defaultWidth,
        height: panel.defaultHeight,
        isVisible: true,
        isPinned: false,
        color: null,
      });
      x += panel.defaultWidth;
      rowHeight = Math.max(rowHeight, panel.defaultHeight);
    }
  }
  return items;
}

/** Saved rows for panels still enabled, plus auto-arranged defaults for any enabled panel with no saved row. */
export async function getLayout(userId: number, enabledPanelIds: string[]): Promise<LayoutItemDTO[]> {
  const rows = await query<LayoutRow>('SELECT * FROM user_layouts WHERE user_id = $1', [userId]);
  const saved = rows.map(toItem);
  const savedIds = new Set(saved.map((item) => item.panelId));
  const enabledSet = new Set(enabledPanelIds);

  const missingIds = enabledPanelIds.filter((id) => !savedIds.has(id));
  const defaults = defaultLayoutFor(missingIds);

  return [...saved.filter((item) => enabledSet.has(item.panelId)), ...defaults];
}

export async function saveLayout(userId: number, items: LayoutItemDTO[]): Promise<void> {
  for (const item of items) {
    await query(
      `INSERT INTO user_layouts (user_id, panel_id, pos_x, pos_y, width, height, is_visible, is_pinned, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, panel_id) DO UPDATE SET
         pos_x = $3, pos_y = $4, width = $5, height = $6,
         is_visible = $7, is_pinned = $8, color = $9, updated_at = NOW()`,
      [
        userId,
        item.panelId,
        item.x,
        item.y,
        item.width,
        item.height,
        item.isVisible,
        item.isPinned,
        item.color,
      ],
    );
  }
}

export async function resetLayout(userId: number): Promise<void> {
  await query('DELETE FROM user_layouts WHERE user_id = $1', [userId]);
}
