# Flashcard Marketplace

A highly scalable flashcard marketplace with a wallet/credit sub-economy, built
on an edge-native stack:

- **Backend** — [Hono](https://hono.dev) API deployed on **Cloudflare Workers**,
  talking to **Turso** (libSQL) via `@libsql/client`.
- **Frontend** — **Vite + React + TypeScript + Tailwind CSS v4**.

This repository is an npm-workspaces monorepo:

```
.
├── backend/     # Hono API (Cloudflare Worker)
├── frontend/    # Vite + React dashboard
└── scripts/     # DB setup + environment bootstrap
```

## Quick start

```bash
# 1. Install the Turso CLI, dependencies, env files, and seed the local DB
bash scripts/cloud-install.sh

# 2. Run everything (local libSQL server + API + web) in one command
npm run dev
```

Then open the frontend at **http://127.0.0.1:5173**. The API runs at
**http://127.0.0.1:8787** and the local libSQL server at
**http://127.0.0.1:8080**.

`npm run dev` starts three processes concurrently:

| Process    | Command                          | URL                     |
| ---------- | -------------------------------- | ----------------------- |
| libSQL DB  | `turso dev --db-file .turso/dev.db` | http://127.0.0.1:8080 |
| API        | `wrangler dev` (backend)         | http://127.0.0.1:8787   |
| Web        | `vite` (frontend)                | http://127.0.0.1:5173   |

In Cloud Agents these same three processes are started as persistent terminals
(see [`.cursor/environment.json`](.cursor/environment.json)).

## Environment variables

Credentials are never hard-coded — the Worker reads them from bindings on every
request (`c.env.TURSO_DATABASE_URL`, `c.env.TURSO_AUTH_TOKEN`).

| Scope    | File / mechanism                | Notes                                        |
| -------- | ------------------------------- | -------------------------------------------- |
| Backend  | `backend/.dev.vars`             | Local `wrangler dev` secrets (git-ignored).  |
| Backend  | `wrangler secret put …`         | Production Turso URL + auth token.           |
| Frontend | `frontend/.env` (`VITE_API_URL`)| Base URL of the API.                         |

`.example` files are committed and copied into place by the install script.

## API

| Method | Route                     | Description                                        |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `/api/decks`              | Public decks sorted by total upvotes (`?user_id=`).|
| GET    | `/api/decks/:id`          | A deck with its cards (powers the study view).      |
| POST   | `/api/decks`              | Create a deck (with optional cards).                |
| POST   | `/api/decks/:id/upvote`   | Toggle the given user's upvote for a deck.          |

### Database schema

The reference schema (`users`, `decks`, `upvotes`, `purchases`) is created and
seeded by [`scripts/db-setup.ts`](scripts/db-setup.ts). A `cards` table is added
to store flashcard content for the interactive study component.

## Scripts

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Run libSQL + API + web together.                |
| `npm run db:setup`  | Create tables and seed sample data (idempotent).|
| `npm run db:reset`  | Recreate the local DB from scratch.             |
| `npm run typecheck` | Strict type-check both packages.                |
| `npm run build`     | Production build of the frontend.               |

## Deployment (backend)

```bash
cd backend
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler deploy
```
