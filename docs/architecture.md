# Architecture

This document explains the three ideas that make this project more than a CRUD demo:
the **module registry**, the **event bus**, and the **panel ≠ logic** separation.

> Status: this file is a placeholder scaffold. It will be filled in as the module
> registry, event bus, and panel layer are implemented.

## 1. Module Registry

A module is a self-registering package that declares:

- its unique id and display name,
- the database tables it owns (its migration files),
- the API routes it exposes,
- the panels it provides (with default sizes and descriptions),
- optional dependencies on other modules.

Adding a fourth module means adding one folder under `server/src/modules/` and one
under `client/src/components/modules/` — no changes to existing modules.

```typescript
const salesModule: ModuleDefinition = {
  id: 'sales',
  name: 'Sales',
  icon: 'shopping-cart',
  description: 'Order management, invoicing, and sales tracking',
  panels: [
    { id: 'sales.orders', name: 'Active Orders', defaultWidth: 2, defaultHeight: 2, component: 'OrdersPanel' },
  ],
  dependencies: ['customers'],
  routes: '/api/modules/sales',
};
```

TODO: document the registry's `register()` / `list()` / `get()` API once implemented
in `server/src/modules/registry.ts` and `client/src/core/module-registry.ts`.

## 2. Event Bus

Modules never import each other directly. They communicate exclusively through a
namespaced pub/sub event bus (`module.event_name`). The Customers module does not
know Sales exists — it just emits `customers.selected`, and whoever cares, listens.

See the event table and `EventBus` class shape in the project spec; implementation
lives in `client/src/core/event-bus.ts`.

## 3. Panel ≠ Logic

Hiding a panel does not disable its module. Example: a sales rep hides the
"Shipping Data" panel, but when they create an order, shipping data is still pulled
from the customer record in the database and attached to the order. The panel is a
view layer; the module logic runs regardless of what's visible.

## Adding a New Module (Developer Guide)

TODO: step-by-step guide once the first module (Customers) is implemented as the
reference example — expected shape:

1. Create `server/src/modules/<name>/` with `.module.ts`, `.routes.ts`, `.service.ts`,
   `.repository.ts`, `.types.ts`.
2. Add a migration file `server/src/migrations/00N_<name>.sql`.
3. Register the module in `server/src/modules/registry.ts`.
4. Create `client/src/components/modules/<name>/` panel components.
5. Register panels in `client/src/core/module-registry.ts`.
6. Add a Zustand slice under `client/src/stores/modules/<name>.store.ts` if the
   module needs local UI state.
