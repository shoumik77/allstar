# PickClash — Peer-to-Peer NFL Picks Platform

A web app where users stake weekly points on NFL picks against each other (no house), with odds-weighted parimutuel payouts, automatic settlement via a sports API, and a weekly leaderboard/prize pool.

## Product Mechanics (agreed)

- **Points economy**: full weekly reset — every user resets to 1,000 pts each Tuesday (after MNF settles). Weekly final balances determine leaderboard and prize-pool shares (Stripe payouts deferred to a later phase).
- **Picks**: a user creates a pick on an NFL game — Moneyline or Spread — choosing a side and staking points. Market odds/line are **snapshotted at pick creation** from the odds API.
- **Joining**: other users either **join** the pick side or **fade** (take the opposite side), staking any amount up to limits.
- **Validity**: a pick is void unless both sides have ≥1 participant by kickoff → all stakes refunded.
- **Payouts (odds-weighted parimutuel with refunds)**: payout ratios pinned to the snapshotted odds, not pool imbalance. Winning a -300 favorite pays ~0.33x stake profit; a +250 dog pays 2.5x. Losing side's pool funds winners proportionally to odds-weighted stakes, capped at the losing pool (payouts scale down pro-rata if it can't cover targets). **Surplus in the losing pool is refunded to losers** — losers only ever lose the odds-fair amount needed to pay winners. Example: Ravens -150, you stake 100 on Ravens, a fader stakes 200 against. Ravens win → you get 100 back + 67 profit; fader loses 67, gets 133 refunded. Ravens lose → fader gets 200 back + your 100 (capped, despite a 260 target); you lose 100.
- **Effective-stake transparency**: at bet time the UI shows your *matched* stake and realistic max win given the current opposite pool (e.g., "only 77 of your 200 pts is currently matched — max win 100"), with a soft warning when a stake far exceeds what the other side can support. Unmatched stake is risk-free but earns nothing, which naturally discourages whale over-staking.
- **Anti-abuse guards**:
  - Max stake per pick: 25% of current balance.
  - Min stake: 10 pts.
  - Picks lock at game kickoff; no edits after first opposing joiner.
  - One account per user (email verification for MVP).

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui, Lucide icons, TanStack Query, React Router.
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL.
- **Auth**: JWT (access + refresh) with bcrypt; email verification stubbed for MVP.
- **Sports data**: The Odds API (free tier: schedules, moneyline/spread odds) + ESPN public scoreboard API for final scores. Requires an `ODDS_API_KEY` env var (I'll point out where to get it).
- **Jobs**: node-cron in the backend process — odds refresh (hourly), score polling + settlement (every 10 min during game windows), weekly reset (Tue 6am ET).
- **Repo layout**: monorepo at `/Users/shoumikbisoi/CascadeProjects/Allstar` with `frontend/` and `backend/` (recommend setting this as the active workspace).

## Environment (verified)

- **Workspace**: `/Users/shoumikbisoi/CascadeProjects/Allstar` (clean; empty `frontend/` and `backend/`). Previous Next.js/Supabase attempt deleted — still recoverable at `github.com/shoumik77/allstar`.
- **Node** v22.12.0, **npm** 10.9.0 — OK.
- **Database**: local Postgres 16 via Docker Compose. Docker 27.4.0 + Compose v2.31.0 installed; **daemon must be started** (Docker Desktop) before `docker compose up`.
- **Secrets**: `backend/.env` (gitignored) holds `DATABASE_URL`, `JWT_SECRET`, `ODDS_API_KEY`; a committed `.env.example` documents them.

## Data Model (Prisma)

- `User` — id, email, username, passwordHash, createdAt
- `WeeklyBalance` — userId, weekId, balance (starts 1000), locked (staked-but-unsettled)
- `Week` — id, nflWeekNumber, startsAt, endsAt, status (open/settling/closed)
- `Game` — externalId, week, homeTeam, awayTeam, kickoff, status, homeScore, awayScore
- `Pick` — id, creatorId, gameId, type (ML/SPREAD), side, line, oddsSnapshot (home/away ML + spread odds), status (open/locked/void/settled), createdAt
- `Position` — pickId, userId, side (with/against), stake, payout (nullable until settled)
- `Transaction` — ledger of all balance changes (stake, refund, payout, weekly_reset) for auditability

## API Surface (Express)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET /games?week=` — schedule + current odds
- `POST /picks` — create pick (validates stake limits, snapshots odds)
- `GET /picks?week=&status=` — browse feed; `GET /picks/:id` — detail with positions
- `POST /picks/:id/positions` — join or fade
- `GET /leaderboard?week=` — ranked balances + projected prize shares
- `GET /me` — profile, balance, positions
- Internal: settlement engine + weekly reset (cron-driven, admin-triggerable via `POST /admin/settle` for safety)

## Frontend Pages

- **Feed** — open picks, filter by game/type, join/fade actions with stake modal
- **Games** — this week's slate with live odds, "create pick" entry point
- **Create Pick** — game → market (ML/spread) → side → stake, shows snapshotted payout ratio
- **My Picks** — created + joined positions, status, projected/settled payouts
- **Leaderboard** — weekly rankings, balance, prize-share % (pool display only; no real money in MVP)
- **Auth** — login/register

## Settlement Logic (core algorithm)

1. When a game goes final: for each pick on it, determine winning side (ML: winner; spread: cover vs. snapshotted line, push → full refund).
2. Void picks with one-sided participation → refund all.
3. Compute each winner's target payout = stake × odds multiplier (from snapshot).
4. Cap total payouts at losing pool; scale winners' payouts pro-rata if targets exceed it. If targets fall short of the pool, refund the surplus to losers pro-rata (losers only lose the odds-fair amount).
5. Write `Transaction` rows and update `WeeklyBalance`.

## Build Phases

1. **Scaffold** — monorepo, backend (Express + Prisma + Postgres via Docker Compose), frontend (Vite + Tailwind + shadcn/ui), auth end-to-end.
2. **Games ingestion** — Odds API + ESPN score integration, `Game`/`Week` sync jobs, games page.
3. **Picks & positions** — create/join/fade flows, stake validation, feed UI.
4. **Settlement engine** — algorithm above with unit tests (push, void, imbalanced pools, favorite/dog cases), score-poll cron.
5. **Weekly cycle** — reset job, leaderboard + prize-share display, transaction history.
6. **Polish** — responsive UI pass, seed script with fake users/picks for demoing before season start.

## Later (out of scope for MVP)

- Stripe Connect for real prize pools (note: real-money contests have legal/compliance implications — skill-game vs. gambling classification varies by state; worth legal review before enabling).
- Player props / totals markets, private leagues, push notifications, mobile app.
