import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import { moduleRegistry } from './modules/registry';
import { registerAllModules } from './modules/register-all';
import { authRouter } from './auth/auth.routes';
import { layoutRouter } from './layout/layout.routes';

registerAllModules();

const app = express();

app.use(cors());
app.use(express.json());

// This is a pure JSON API — the app itself is served by the client's Vite
// dev server (or its built static files), not from here. A bare `GET /`
// hits Express's default 404 otherwise, which reads like something's
// broken rather than "you're looking at the wrong port".
app.get('/', (_req, res) => {
  res.json({
    message: 'Modular Business App API. The web app runs on the client dev server (see README) — this port only serves /api/*.',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Exposes what the client needs to render the Module Navigator and the
// "enable module" list — never internal wiring like the Express router.
app.get('/api/modules', (_req, res) => {
  const modules = moduleRegistry.list().map(({ id, name, icon, description, panels, dependencies }) => ({
    id,
    name,
    icon,
    description,
    panels,
    dependencies: dependencies ?? [],
  }));
  res.json(modules);
});

app.use('/api/auth', authRouter);
app.use('/api/layout', layoutRouter);

for (const module of moduleRegistry.list()) {
  if (module.router) {
    app.use(module.routes, module.router);
  }
}

app.use(errorMiddleware);

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
