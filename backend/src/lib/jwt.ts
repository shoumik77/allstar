import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { unauthorized } from './errors.js';

export type TokenPayload = { sub: string };

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtAccessSecret, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtRefreshSecret, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
    if (!decoded.sub) throw new Error('missing sub');
    return { sub: String(decoded.sub) };
  } catch {
    throw unauthorized('Invalid or expired access token', 'invalid_access_token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret) as jwt.JwtPayload;
    if (!decoded.sub) throw new Error('missing sub');
    return { sub: String(decoded.sub) };
  } catch {
    throw unauthorized('Invalid or expired refresh token', 'invalid_refresh_token');
  }
}
