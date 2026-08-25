# Architecture

This document explains the three ideas that make this project more than a CRUD demo:
the **module registry**, the **event bus**, and the **panel ≠ logic** separation.

> Status: module registry, event bus, and the Customers module (server + client)
> are implemented. Sales, Inventory, and the panel grid shell are next.

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

The registry lives in two places:

- **Server** (`server/src/modules/registry.ts`) — an in-memory `Map<id, ModuleDefinition>`.
  `register()` rejects a module whose declared `dependencies` aren't registered
  yet, so registration order enforces the dependency graph. `list()` /`get()` /
  `has()` are used by `index.ts` to mount each module's Express router at its
  declared `routes` path and to serve `GET /api/modules`.
- **Client** (`client/src/core/module-registry.ts`) — holds two independent
  pieces of state: the `ModuleDefinition[]` fetched from `GET /api/modules`
  (`setModules`/`getModules`/`getModule`), and a `panelComponents` map that
  each panel file populates as a side effect of being imported, e.g. at the
  bottom of `CustomerListPanel.tsx`:
  ```typescript
  moduleRegistry.registerPanelComponent('CustomerListPanel', CustomerListPanel);
  ```
  The Dashboard grid resolves a `PanelDefinition.component` string to a real
  component via `moduleRegistry.getPanelComponent(name)`.

## 2. Event Bus

Modules never import each other directly. They communicate exclusively through a
namespaced pub/sub event bus (`module.event_name`). The Customers module does not
know Sales exists — it just emits `customers.selected`, and whoever cares, listens.

Implementation lives in `client/src/core/event-bus.ts` — a `Map<event, Set<handler>>`
with `emit`/`on`/`off`, plus a singleton export. The `useEventBus` hook
(`client/src/hooks/useEventBus.ts`) subscribes on mount and unsubscribes on
unmount so a closed panel never leaks a listener.

Events implemented so far (Customers module):

| Event | Emitter | Payload | Listeners |
|---|---|---|---|
| `customers.selected` | `CustomerListPanel` (via `customers.store`) | `{ customerId: number }` | `CustomerDetailPanel` |
| `customers.created` | `NewCustomerPanel` | `{ customer: Customer }` | `CustomerListPanel` (refresh) |
| `customers.updated` | `CustomerDetailPanel` | `{ customer: Customer }` | `CustomerListPanel` (refresh) |

Sales and Inventory will add `sales.*` / `inventory.*` events the same way —
see the full catalog in the original project spec.

## 3. Panel ≠ Logic

Hiding a panel does not disable its module. Example: a sales rep hides the
"Shipping Data" panel, but when they create an order, shipping data is still pulled
from the customer record in the database and attached to the order. The panel is a
view layer; the module logic runs regardless of what's visible.

## Adding a New Module (Developer Guide)

The Customers module (`server/src/modules/customers/`, `client/src/components/modules/customers/`)
is the reference implementation. To add module N, copy its shape:

1. **Migration** — add `server/src/migrations/00N_<name>.sql` with the module's
   tables. The runner picks up any new `*.sql` file automatically on the next
   `npm run migrate`.
2. **Server module** — create `server/src/modules/<name>/` with:
   - `<name>.types.ts` — the domain type + input types.
   - `<name>.repository.ts` — raw parameterized SQL, one function per query,
     mapping snake_case DB rows to camelCase domain objects.
   - `<name>.service.ts` — validation and business rules, throws `HttpError`
     (`server/src/middleware/error.middleware.ts`) for 4xx cases.
   - `<name>.routes.ts` — an Express `Router`, every handler wrapped in
     `asyncHandler` so rejected promises reach the global error handler.
   - `<name>.module.ts` — the `ModuleDefinition`: id, panels, `routes` base
     path, the router, and `dependencies` if it needs another module's data.
3. **Register it** — one line in `server/src/index.ts`:
   `moduleRegistry.register(<name>Module)`, placed after any modules it
   depends on.
4. **Client panels** — create `client/src/components/modules/<name>/` with one
   component per panel declared in the module definition. At the bottom of
   each panel file, self-register it:
   `moduleRegistry.registerPanelComponent('MyPanel', MyPanel)`.
5. **Client store** (only if the module needs shared UI state, e.g. a
   selection) — `client/src/stores/modules/<name>.store.ts`, a Zustand slice.
   Emit/listen on `eventBus` for anything other panels or modules care about
   — never import another module's files directly.
6. **API calls** from panels go through `useModuleApi('<name>')`
   (`client/src/hooks/useModuleApi.ts`), which scopes fetches to
   `/api/modules/<name>`.

That's the whole surface area. Nothing outside the module's own folder pair
needs to change except the one registration line.
