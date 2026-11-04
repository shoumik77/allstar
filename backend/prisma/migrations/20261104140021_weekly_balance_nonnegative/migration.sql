ALTER TABLE "WeeklyBalance"
  ADD CONSTRAINT "WeeklyBalance_balance_nonnegative" CHECK ("balance" >= 0),
  ADD CONSTRAINT "WeeklyBalance_locked_nonnegative"  CHECK ("locked" >= 0);
