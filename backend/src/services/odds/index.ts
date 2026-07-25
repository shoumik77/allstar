import { env } from '../../env.js';
import { MockOddsProvider } from './mock.js';
import type { OddsProvider } from './types.js';

let provider: OddsProvider | null = null;

export function getOddsProvider(): OddsProvider {
  if (provider) return provider;

  if (env.oddsProvider === 'theoddsapi') {
    // Phase 2 runs on mock data; the real provider lands when a key is wired up.
    throw new Error('ODDS_PROVIDER=theoddsapi is not implemented yet — use "mock"');
  }

  provider = new MockOddsProvider();
  return provider;
}

export type { OddsProvider, ProviderGame } from './types.js';
