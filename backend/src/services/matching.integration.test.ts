import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../prisma.js';
import { placeOrder } from './matching.js';
import { HttpError } from '../lib/errors.js';
import { createGamePick, createUser, createWeek, setBalance, truncateAll } from '../test/fixtures.js';

const balanceOf = async (userId: string, weekId: string) =>
  prisma.weeklyBalance.findUniqueOrThrow({ where: { userId_weekId: { userId, weekId } } });

const rejectionCode = (result: PromiseSettledResult<unknown>) =>
  result.status === 'rejected' ? (result.reason as HttpError).code : null;

describe('test database wiring', () => {
  beforeEach(truncateAll);

  it('connects to pickclash_test, not the dev database', async () => {
    const rows = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`;
    expect(rows[0]?.current_database).toBe('pickclash_test');
  });
});

describe('placeOrder balance solvency', () => {
  beforeEach(truncateAll);

  const runTenConcurrentOrders = async () => {
    const user = await createUser();
    const week = await createWeek();
    const { pick } = await createGamePick(week.id);
    await setBalance(user.id, week.id, 100);

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => placeOrder(user.id, pick.id, { side: 'WITH', risked: 10 })),
    );
    return { user, week, pick, results };
  };

  it('enforces the cap across concurrent debits on the same pick', async () => {
    const { user, week, results } = await runTenConcurrentOrders();

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(7);
    expect(rejected).toHaveLength(3);
    for (const r of rejected) {
      expect(rejectionCode(r)).toBe('risk_above_max');
    }

    const balance = await balanceOf(user.id, week.id);
    expect(balance.balance).toBe(30);
    expect(balance.locked).toBe(70);
    expect(balance.balance + balance.locked).toBe(100);
  });

  it('enforces the cap across concurrent debits on different picks', async () => {
    const user = await createUser();
    const week = await createWeek();
    const picks = await Promise.all([
      createGamePick(week.id),
      createGamePick(week.id),
      createGamePick(week.id),
    ]);
    await setBalance(user.id, week.id, 100);

    const results = await Promise.allSettled(
      picks.map(({ pick }) => placeOrder(user.id, pick.id, { side: 'WITH', risked: 25 })),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    for (const r of rejected) {
      expect(rejectionCode(r)).toBe('risk_above_max');
    }

    const balance = await balanceOf(user.id, week.id);
    expect(balance.balance).toBe(75);
    expect(balance.locked).toBe(25);
    expect(balance.balance + balance.locked).toBe(100);
  });

  it('rolls back rejected debits entirely: no orders, stakes, or matches', async () => {
    const { pick, results } = await runTenConcurrentOrders();
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(3);

    expect(await prisma.order.count({ where: { pickId: pick.id } })).toBe(7);
    expect(await prisma.match.count({ where: { pickId: pick.id } })).toBe(0);

    const stakes = await prisma.transaction.findMany({ where: { pickId: pick.id, type: 'STAKE' } });
    expect(stakes).toHaveLength(7);
    expect(stakes.reduce((sum, t) => sum + t.amount, 0)).toBe(-70);
  });

  it('returns precise error codes on the racing request', async () => {
    const user = await createUser();
    const week = await createWeek();
    const { pick } = await createGamePick(week.id);
    await setBalance(user.id, week.id, 40);

    const results = await Promise.allSettled(
      Array.from({ length: 2 }, () => placeOrder(user.id, pick.id, { side: 'WITH', risked: 10 })),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejectionCode(rejected[0]!)).toBe('risk_above_max');

    const other = await createUser();
    await setBalance(other.id, week.id, 12);
    await expect(placeOrder(other.id, pick.id, { side: 'WITH', risked: 20 })).rejects.toMatchObject({
      code: 'insufficient_balance',
    });
  });

  it('rejects negative balances at the database level', async () => {
    const user = await createUser();
    const week = await createWeek();
    await setBalance(user.id, week.id, 100);

    const balanceErr = await prisma
      .$executeRaw`UPDATE "WeeklyBalance" SET "balance" = -1 WHERE "userId" = ${user.id} AND "weekId" = ${week.id}`
      .then(() => null, (e: unknown) => e);
    expect(balanceErr).not.toBeNull();
    expect(String((balanceErr as { meta?: { code?: string }; message?: string }).meta?.code ?? (balanceErr as Error).message)).toContain('23514');

    const lockedErr = await prisma
      .$executeRaw`UPDATE "WeeklyBalance" SET "locked" = -1 WHERE "userId" = ${user.id} AND "weekId" = ${week.id}`
      .then(() => null, (e: unknown) => e);
    expect(lockedErr).not.toBeNull();
    expect(String((lockedErr as { meta?: { code?: string }; message?: string }).meta?.code ?? (lockedErr as Error).message)).toContain('23514');
  });

  it('still matches opposing orders end to end', async () => {
    const backer = await createUser();
    const layer = await createUser();
    const week = await createWeek();
    const { pick } = await createGamePick(week.id);
    await setBalance(backer.id, week.id, 1000);
    await setBalance(layer.id, week.id, 1000);

    const first = await placeOrder(backer.id, pick.id, { side: 'WITH', risked: 100, limitOdds: -150 });
    const second = await placeOrder(layer.id, pick.id, { side: 'AGAINST', risked: 67, limitOdds: -150 });

    expect(second.fills).toHaveLength(1);
    expect(second.matched).toBe(67);

    const matches = await prisma.match.findMany({ where: { pickId: pick.id } });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.withStake).toBe(100);
    expect(matches[0]?.againstLiability).toBe(67);

    const backerOrder = await prisma.order.findUniqueOrThrow({ where: { id: first.order.id } });
    const layerOrder = await prisma.order.findUniqueOrThrow({ where: { id: second.order.id } });
    expect(backerOrder.status).toBe('FILLED');
    expect(layerOrder.status).toBe('FILLED');

    const backerBalance = await balanceOf(backer.id, week.id);
    const layerBalance = await balanceOf(layer.id, week.id);
    expect(backerBalance.balance + backerBalance.locked).toBe(1000);
    expect(layerBalance.balance + layerBalance.locked).toBe(1000);
  });
});
