process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://pickclash:pickclash@localhost:5433/pickclash_test?schema=public';
