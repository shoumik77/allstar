

Head-to-head NFL pick'em with weekly points. Users create a pick (moneyline or spread) at
snapshotted odds, and others stake **with** or **against** it. Everyone starts each week
with 1,000 points.

## Stack

- **Backend** — Node + Express + TypeScript, Prisma, PostgreSQL, JWT auth
- **Frontend** — React + Vite + TypeScript, TailwindCSS, TanStack Query, React Router
- **Infra** — Docker Compose for Postgres

## Getting started

```bash
npm install
cp backend/.env.example backend/.env
npm run db:up                       # Postgres on localhost:5433
npm run prisma:migrate --workspace backend
npm run seed --workspace backend    # mock odds slate for the current week
npm run dev                         # API on :4000, web on :5173
```

## Workspace scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run backend + frontend together |
| `npm run db:up` / `npm run db:down` | Start/stop Postgres |
| `npm run seed --workspace backend` | Sync a week of games from the odds provider |
| `npm run test --workspace backend` | Backend unit tests |

## Odds provider

`ODDS_PROVIDER=mock` (default) generates a deterministic 16-game slate per week, so the app
is fully usable in the offseason. A real provider (The Odds API) can be swapped in behind
the `OddsProvider` interface in `backend/src/services/odds/`.

## API

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login`, `/auth/refresh` | JWT access + refresh tokens |
| `GET` | `/me` | Profile, current week, balance, positions |
| `GET` | `/games` | Week slate with current odds |
| `GET` | `/picks`, `/picks/:id` | Picks with pool totals |
| `POST` | `/picks` | Create a pick (snapshots odds, stakes points) |
| `POST` | `/picks/:id/positions` | Join with or fade a pick |
| `POST` | `/admin/sync`, `/admin/games/:id/state` | Dev helpers for syncing and fast-forwarding games |

## Rules

- Minimum stake 10 points; maximum 25% of your available balance
- Picks lock at kickoff
- Payouts are pinned to the odds snapshotted at pick creation; a side's winnings are capped
  by the opposite pool, with the shortfall shared pro-rata
