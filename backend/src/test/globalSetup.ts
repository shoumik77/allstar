import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://pickclash:pickclash@localhost:5433/pickclash_test?schema=public';

export default async function setup(): Promise<void> {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, '');
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run integration tests against "${dbName}": database name must contain "test"`);
  }

  const maintenance = new URL(TEST_DATABASE_URL);
  maintenance.pathname = '/postgres';
  const admin = new PrismaClient({ datasources: { db: { url: maintenance.toString() } } });
  try {
    const existing = await admin.$queryRaw<Array<{ datname: string }>>`
      SELECT datname FROM pg_database WHERE datname = ${dbName}
    `;
    if (existing.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });

  process.env.DATABASE_URL = TEST_DATABASE_URL;
}
