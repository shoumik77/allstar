import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { ensureWeeklyBalance, getOrCreateCurrentWeek } from '../services/weeks.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

function tokensFor(userId: string) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username }] },
    });
    if (existing) {
      throw conflict(
        existing.email === normalizedEmail ? 'Email already registered' : 'Username already taken',
        'user_exists',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, username, passwordHash },
    });

    const week = await getOrCreateCurrentWeek();
    await ensureWeeklyBalance(user.id, week.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username },
      ...tokensFor(user.id),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw unauthorized('Invalid email or password', 'invalid_credentials');
    }

    const week = await getOrCreateCurrentWeek();
    await ensureWeeklyBalance(user.id, week.id);

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      ...tokensFor(user.id),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const { sub } = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) throw unauthorized('User no longer exists', 'user_not_found');
    res.json(tokensFor(user.id));
  } catch (err) {
    next(err);
  }
});
