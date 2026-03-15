-- PHASE 1: Safe to run NOW on the live database.
-- Adds user_id column. Existing plans keep NULL (unclaimed).
-- The current "allow all" RLS policy stays — app keeps working unchanged.

alter table plans
  add column if not exists user_id uuid references auth.users(id);

-- Optional: index for fast lookup of a user's plans
create index if not exists plans_user_id_idx on plans(user_id);
