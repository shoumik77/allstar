# Allstar

**A peer-to-peer NFL prediction market where users put points behind their picks and compete against each other instead of a house.**

Allstar is a full-stack sports prediction platform built with **TypeScript, React, Node.js, Express, PostgreSQL, and Prisma**.

Users receive **1,000 points each week** and can create NFL moneyline or spread picks at snapshotted odds. Other users can take either side of those picks, creating a peer-to-peer market where payouts depend on the positions users take against each other.

The project focuses on the systems behind a betting-style platform: **position tracking, odds snapshots, payout calculations, balance management, game settlement, authentication, and market state**.

> No house. No infinite liquidity. Every position has to be backed by another user.

---

## Demo

COMING SOON

**Demo flow:** Create an account, browse the weekly NFL slate, open a pick, take a position, inspect the pool, simulate the game result, and watch balances and positions settle automatically.

---

## How Allstar Works

Every user starts the week with:

```text
1,000 points
```

Users can browse the NFL slate and create a pick on either a **moneyline** or **spread** market.

For example:

```text
Bills -3.5
Odds: -110
Stake: 100 points
```

Creating the pick snapshots the current odds and commits the creator's stake.

Other users can then choose to:

```text
WITH
Bills -3.5

        or

AGAINST
Bills -3.5
```

Instead of betting against a sportsbook, users are taking positions against one another.

Once the game starts, the market locks. When the game finishes, Allstar determines the winning side and settles the market.

---

## Core Features

### Peer-to-Peer Picks

Users create their own markets from the current NFL slate.

Each pick stores:

- Game
- Market type
- Selected side
- Spread, when applicable
- Snapshotted odds
- Creator stake
- Creation time
- Lock time

Other users can join the market by taking a position **with or against** the original pick.

---

### Weekly Point Economy

Every user receives **1,000 points per week**.

Points act as the platform's internal currency and make it possible to model betting mechanics without real-money transactions.

Balance rules prevent users from committing more points than they have available.

Individual positions are also limited to **25% of the user's available balance**, with a minimum stake of **10 points**.

---

### Odds Snapshotting

Odds can change throughout the week.

To keep existing positions deterministic, Allstar snapshots the odds when a pick is created.

```text
Live odds change
       │
       ▼
Existing pick keeps original odds
       │
       ▼
Settlement uses snapshotted price
```

This separates the external odds feed from the internal contract created between users.

---

### Position & Pool Tracking

Each pick maintains the amount of points committed to both sides of the market.

```text
                 PICK
                  │
          ┌───────┴───────┐
          ▼               ▼
       WITH Pool       AGAINST Pool
          │               │
       User A            User C
       User B            User D
```

As users enter the market, Allstar tracks their individual positions along with aggregate exposure on each side.

---

### Market-Aware Payouts

Allstar cannot assume unlimited liquidity.

A user's theoretical winnings may exceed the amount actually available from the opposing side of the market.

To handle this, payouts are capped by the opposing pool.

If the winning side is entitled to more points than the losing side can cover, the available payout is distributed **pro-rata** across winning positions.

This keeps settlement backed by actual positions rather than creating points to satisfy theoretical payouts.

---

### Game Locking

Markets remain open until kickoff.

Once a game begins:

```text
OPEN → LOCKED → FINAL → SETTLED
```

New picks and positions are rejected after the game locks.

This prevents users from entering a market after the outcome has begun to become known.

---

### Automatic Settlement

When a game reaches its final state, Allstar:

1. Determines the winning side of each market.
2. Calculates the available opposing pool.
3. Computes each winning position's payout.
4. Handles any pool shortfall proportionally.
5. Updates user balances.
6. Marks the relevant positions and picks as settled.

The result is a complete lifecycle from **market creation → position entry → game completion → settlement**.

---

### Authentication

Allstar includes account creation and login with **JWT-based authentication**.

The backend uses access and refresh tokens to authenticate protected API requests.

Authenticated users can access their:

- Current balance
- Weekly state
- Active positions
- Settled positions
- Created picks

---

### Mock NFL Slate

Development shouldn't depend on the NFL season being active.

The default odds provider generates a deterministic **16-game weekly slate**, allowing the full application to run during the offseason and making development and testing reproducible.

---

### Game Simulator

Allstar includes development tooling for moving games through their lifecycle without waiting for real NFL games.

Games can be fast-forwarded through states such as:

```text
Scheduled
    ↓
In Progress
    ↓
Final
    ↓
Settlement
```

This makes it possible to test the entire market lifecycle locally in seconds.

---

## System Architecture

```text
                        ┌───────────────────┐
                        │    React Client   │
                        │  Vite + Tailwind  │
                        └─────────┬─────────┘
                                  │
                               HTTP API
                                  │
                                  ▼
                        ┌───────────────────┐
                        │  Express Backend  │
                        │    TypeScript     │
                        └─────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          Auth Service       Market Logic        Odds Service
              │                   │                   │
              │                   │             OddsProvider
              │                   │                   │
              └─────────────┬─────┘          ┌────────┴────────┐
                            │                ▼                 ▼
                            ▼             Mock Odds        Real API
                     Prisma ORM
                            │
                            ▼
                       PostgreSQL
```

The frontend communicates with a TypeScript/Express API.

Business logic for picks, positions, balances, and settlement lives on the backend rather than being trusted to the client.

Prisma provides the database layer over PostgreSQL, while the odds system is isolated behind an `OddsProvider` interface.

---

## Odds Provider Abstraction

External sports APIs should not control the rest of the application's architecture.

Allstar defines an `OddsProvider` interface that separates the source of NFL data from the rest of the backend.

```text
                   OddsProvider
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
       Mock Provider         The Odds API
```

The default configuration is:

```env
ODDS_PROVIDER=mock
```

The mock provider generates a deterministic weekly slate, while a real provider can be swapped in without rewriting the market or settlement logic.

---

## Engineering Highlights

Allstar was built as more than a CRUD sports app. The core challenge was designing the state and accounting rules behind a peer-to-peer market.

Some of the main engineering problems include:

- Modeling peer-to-peer positions and opposing exposure
- Preventing users from overcommitting their balances
- Snapshotting external odds for deterministic settlement
- Handling insufficient opposing liquidity
- Distributing shortfalls proportionally
- Locking markets based on game state
- Settling multiple positions consistently
- Separating external odds providers from domain logic
- Managing weekly balances and position state
- Building authenticated frontend/backend flows
- Creating deterministic development data
- Simulating the complete game lifecycle locally

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT authentication

### Database & Infrastructure

- PostgreSQL
- Docker Compose

### External Data

- Provider-based odds architecture
- Mock NFL odds provider
- The Odds API integration path

---

## Repository Structure

```text
allstar/
├── backend/
│   ├── prisma/                 # Database schema + migrations
│   └── src/
│       ├── routes/             # Express API routes
│       ├── services/           # Business logic
│       │   └── odds/           # OddsProvider implementations
│       └── ...
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
│
├── docker-compose.yml          # Local PostgreSQL
├── package.json                # Workspace scripts
└── README.md
```

---

## API

### Authentication

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Authenticate a user |
| `POST` | `/auth/refresh` | Refresh authentication |
| `GET` | `/me` | Get profile, balance, week, and positions |

### Games

| Method | Route | Description |
|---|---|---|
| `GET` | `/games` | Get the current weekly NFL slate |

### Picks

| Method | Route | Description |
|---|---|---|
| `GET` | `/picks` | Browse available picks |
| `GET` | `/picks/:id` | Get pick and pool details |
| `POST` | `/picks` | Create a pick |
| `POST` | `/picks/:id/positions` | Take a position with or against a pick |

### Development

| Method | Route | Description |
|---|---|---|
| `POST` | `/admin/sync` | Sync the weekly game slate |
| `POST` | `/admin/games/:id/state` | Move a game through its lifecycle |

---

## Getting Started

### Requirements

- Node.js
- npm
- Docker

Clone the repository:

```bash
git clone https://github.com/shoumik77/allstar.git
cd allstar
```

Install dependencies:

```bash
npm install
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Start PostgreSQL:

```bash
npm run db:up
```

PostgreSQL runs locally on:

```text
localhost:5433
```

Run database migrations:

```bash
npm run prisma:migrate --workspace backend
```

Seed the current week's NFL slate:

```bash
npm run seed --workspace backend
```

Start the application:

```bash
npm run dev
```

The services will be available at:

```text
API       http://localhost:4000
Frontend  http://localhost:5173
