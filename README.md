# Modular Business App

A modular, panel-based dashboard platform for small businesses (retail shops, hair
salons, pizzerias, warehouses, factories) — enable only the modules you need, and
arrange the dashboard panels freely.

> **Status:** early scaffold. The repository structure, database schema, and tooling
> config are in place; module and UI implementation is in progress. See
> [Roadmap](#roadmap) below.

## Architecture Overview

Three ideas carry the architectural value of this project — the demo modules exist
to prove they work:

1. **Module registry** — modules self-register declaratively (tables, routes, panels,
   dependencies). Adding a fourth module is one folder in `server/src/modules/` and
   one in `client/src/components/modules/`.
2. **Event bus** — modules never import each other. `Customers` emits
   `customers.selected`; `Sales` listens — but `Customers` has no idea `Sales`
   exists. Full decoupling between modules.
3. **Panel ≠ logic** — hiding a panel never disables its module. A sales rep can hide
   the shipping panel; the order still pulls shipping data from the database.

Full write-up: [docs/architecture.md](docs/architecture.md).

## Demo Modules

| Module | Purpose |
|---|---|
| **Customers** | Client/customer records. Shared dependency for Sales. |
| **Sales** | Order management with line items and basic invoicing. |
| **Inventory** | Stock tracking with low-stock alerts. |

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Industry-standard, fast dev loop. |
| State | Zustand | Lightweight; each module registers its own slice without Redux boilerplate. |
| Styling | Tailwind CSS (Vite plugin build) | Utility-first, no CDN — a proper build pipeline. |
| Grid layout | react-grid-layout | Proven drag/resize/persist grid — no reason to hand-roll one. |
| Backend | Node.js + Express + TypeScript | Simple, explicit, easy to reason about per-module routing. |
| Database | PostgreSQL 16 (Docker) | Relational fit for structured business data with cross-module FKs. |
| DB access | `pg` with raw parameterized SQL, no ORM | Demonstrates SQL proficiency; queries are handwritten and readable. |
| Auth | JWT | Simple single-tenant demo auth; architecture supports multi-user. |

## Prerequisites

- Node.js 22+
- Docker (for PostgreSQL)

## Setup

```bash
git clone <repo-url>
cd modular-business-app

docker compose up -d

cd server
npm install
npm run migrate
npm run seed
npm run dev

# in a second terminal
cd client
npm install
npm run dev
```

Open http://localhost:5173.

### Seed Users

| Username | Role | Enabled modules |
|---|---|---|
| `admin` | Admin User | Customers, Sales, Inventory (all panels) |
| `sales_rep` | Anna Sprzedaż | Customers, Sales |
| `warehouse` | Marek Magazyn | Customers, Inventory |

Log in as different users to see different module sets and panel layouts.

## Running Tests

```bash
cd server
npm test
```

## Roadmap

- [x] Repository structure, tooling config, DB schema
- [ ] Module registry (server + client) and migration runner
- [ ] Event bus
- [ ] Customers module (reference implementation for "how to add a module")
- [ ] Sales module
- [ ] Inventory module
- [ ] Panel grid + layout persistence
- [ ] Seed data
- [ ] Screenshots in `docs/screenshots/`

See [docs/architecture.md](docs/architecture.md) for the developer guide on adding a
new module once the reference implementation lands.

## License

MIT — see [LICENSE](LICENSE).
