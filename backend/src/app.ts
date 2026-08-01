import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { gamesRouter } from './routes/games.js';
import { adminRouter } from './routes/admin.js';
import { picksRouter } from './routes/picks.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/games', gamesRouter);
  app.use('/picks', picksRouter);
  app.use('/leaderboard', leaderboardRouter);
  app.use('/admin', adminRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found', code: 'not_found' }));
  app.use(errorHandler);

  return app;
}
