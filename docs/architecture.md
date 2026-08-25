# Architecture

This document explains the three ideas that make this project more than a CRUD demo:
the **module registry**, the **event bus**, and the **panel ≠ logic** separation.

> Status: everything below is implemented and running — module registry, event
> bus, all 3 demo modules, auth, and the panel grid with persisted layouts.

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

Events implemented so far (Customers + Sales):

| Event | Emitter | Payload | Listeners |
|---|---|---|---|
| `customers.selected` | `CustomerListPanel` (via `customers.store`) | `{ customerId: number }` | `CustomerDetailPanel`, `NewOrderPanel` |
| `customers.created` | `NewCustomerPanel` | `{ customer: Customer }` | `CustomerListPanel` (refresh) |
| `customers.updated` | `CustomerDetailPanel` | `{ customer: Customer }` | `CustomerListPanel` (refresh) |
| `sales.order-created` | `NewOrderPanel` | `{ order: OrderWithItems }` | `OrdersPanel`, `SalesAlertsPanel` (refresh) |
| `sales.order-selected` | `OrdersPanel` (via `sales.store`) | `{ orderId: number }` | `OrderDetailPanel` |
| `sales.status-changed` | `OrderDetailPanel` | `{ orderId: number, newStatus: OrderStatus }` | `OrdersPanel`, `SalesAlertsPanel` (refresh) |

This is Sales depending on Customers in action: `NewOrderPanel` pre-fills from
`customers.selected` without importing anything from the Customers module —
it only knows the event name and payload shape.

Inventory has no module dependencies, and its events show the other pattern —
one panel owning a poll and broadcasting what it found, so any other panel
can react without running its own fetch loop:

| Event | Emitter | Payload | Listeners |
|---|---|---|---|
| `inventory.low-stock` | `StockAlertsPanel` (polls every 60s) | `{ products: Product[] }` | (available for any panel that wants it) |
| `inventory.stock-moved` | `StockMovementPanel` | `{ productId, type, qty }` | `ProductListPanel`, `StockAlertsPanel` (refresh) |

## 3. Panel ≠ Logic

Hiding a panel does not disable its module. Example: a sales rep hides the
"Shipping Data" panel, but when they create an order, shipping data is still pulled
from the customer record in the database and attached to the order. The panel is a
view layer; the module logic runs regardless of what's visible.

## 4. Auth, Layout Persistence, and the Panel Grid

The pieces that turn the modules above into something you actually open in a
browser:

- **Auth** (`server/src/auth/`) — a `users` table, bcrypt password hashes, and
  a JWT (`server/src/middleware/auth.middleware.ts`) carrying `{ id, username,
  role }`. `GET /api/auth/me` returns the user plus `enabledModuleIds` — the
  `user_modules` join table. `PATCH /api/auth/modules/:id` toggles a module
  on/off for the logged-in user and, if the module being enabled has
  dependencies, auto-enables those too (and reports which ones, so the
  Settings page can say why something else just lit up).
- **Layout persistence** (`server/src/layout/`) — `user_layouts` stores one
  row per (user, panel): position, size, visibility, pin state. `GET
  /api/layout` merges saved rows with auto-arranged defaults (a simple
  left-to-right bin-pack, `defaultLayoutFor` in `layout.service.ts`) for any
  enabled panel that doesn't have a saved row yet — so a module you just
  enabled shows up somewhere sane instead of nowhere. `POST /api/layout/reset`
  deletes the saved rows, falling back to those defaults.
- **Client bootstrap** — `client/src/core/panel-manifest.ts` imports every
  panel file purely for its self-registration side effect (see §1); `App.tsx`
  restores a session from `localStorage` on load; `modules.store.ts` fetches
  the module catalog and keeps the *enabled* subset in its own Zustand state
  (`enabledModules`) rather than reading `moduleRegistry` directly in a render
  body — `moduleRegistry` is a plain singleton, so components that read it
  without a store subscription never re-render when it changes. `ModuleNavigator`
  and `Dashboard` both learned this the hard way (see the bug note below).
- **The grid** (`client/src/components/layout/Dashboard.tsx`) — a thin wrapper
  around `react-grid-layout`. `PanelWrapper.tsx` renders the pin/minimize/close
  chrome every panel gets regardless of module, and *is* the drag handle
  (`.panel-drag-handle`, passed to `GridLayout` as `draggableHandle`). Pinned
  panels are marked `static` so the grid won't move them.

**Bug found and fixed during manual testing:** the pin/minimize/close buttons
live inside the drag handle. A real mouse click is a `mousedown` →
(micro-)`move` → `mouseup` sequence, and react-draggable — which
react-grid-layout uses internally — was interpreting that sequence as a drag
attempt and swallowing the click before it ever reached the button's
`onClick`. A synthetic `element.click()` doesn't reproduce this (no mousedown/
mouseup), which is why it went unnoticed until a real headless-browser click
was used to verify the feature. Fixed with one `onMouseDown={(e) =>
e.stopPropagation()}` on the button row, so the drag handler never sees the
mousedown in the first place. A second, related bug in the same pass: `Dashboard`'s
`onLayoutChange` closed over `items` from render scope, and react-grid-layout
calls that callback on every render (not just real drags/resizes) — a stale
closure could occasionally re-save an old visibility/pin state over a newer
one. Fixed by reading `useLayoutStore.getState().items` fresh inside the
callback and only writing back when x/y/w/h actually changed.

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
