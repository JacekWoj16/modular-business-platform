import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import * as authService from './auth.service';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.username, req.body.password);
    res.json(result);
  }),
);

// GET /api/auth/me — the logged-in user plus which modules are enabled for them
authRouter.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const enabledModuleIds = await authService.getEnabledModuleIds(req.user!.id);
    res.json({ user: req.user, enabledModuleIds });
  }),
);

// PATCH /api/auth/modules/:moduleId — toggle a module on/off for the logged-in user
authRouter.patch(
  '/modules/:moduleId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const autoEnabled = await authService.setModuleEnabled(
      req.user!.id,
      req.params.moduleId!,
      Boolean(req.body.enabled),
    );
    const enabledModuleIds = await authService.getEnabledModuleIds(req.user!.id);
    res.json({ enabledModuleIds, autoEnabled });
  }),
);
