import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { moduleRegistry } from '../modules/registry';
import * as authService from '../auth/auth.service';
import * as layoutService from './layout.service';

export const layoutRouter = Router();
layoutRouter.use(authMiddleware);

async function enabledPanelIds(userId: number): Promise<string[]> {
  const moduleIds = await authService.getEnabledModuleIds(userId);
  const panelIds: string[] = [];
  for (const moduleId of moduleIds) {
    const moduleDef = moduleRegistry.get(moduleId);
    if (moduleDef) {
      panelIds.push(...moduleDef.panels.map((panel) => panel.id));
    }
  }
  return panelIds;
}

// GET /api/layout — the logged-in user's saved panel layout (plus defaults for anything unsaved)
layoutRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const panelIds = await enabledPanelIds(req.user!.id);
    const items = await layoutService.getLayout(req.user!.id, panelIds);
    res.json({ items });
  }),
);

// PUT /api/layout — replace the saved layout wholesale (position/size/visibility/pin changes)
layoutRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    await layoutService.saveLayout(req.user!.id, req.body.items ?? []);
    res.status(204).send();
  }),
);

// POST /api/layout/reset — clear saved positions, back to module defaults
layoutRouter.post(
  '/reset',
  asyncHandler(async (req, res) => {
    await layoutService.resetLayout(req.user!.id);
    const panelIds = await enabledPanelIds(req.user!.id);
    const items = await layoutService.getLayout(req.user!.id, panelIds);
    res.json({ items });
  }),
);
