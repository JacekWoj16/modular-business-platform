import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorMiddleware } from './middleware/error.middleware';
import { moduleRegistry } from './modules/registry';

// TODO: as each module is implemented, import its `<name>.module.ts` here so
// registration runs before the server starts listening, e.g.:
//   import { customersModule } from './modules/customers/customers.module';
//   moduleRegistry.register(customersModule);
// Then mount each module's router below.

const app = express();

app.use(cors());
app.use(express.json());

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

for (const module of moduleRegistry.list()) {
  if (module.router) {
    app.use(module.routes, module.router);
  }
}

app.use(errorMiddleware);

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
