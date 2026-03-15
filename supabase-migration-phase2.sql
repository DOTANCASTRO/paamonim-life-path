-- PHASE 2: Run ONLY when deploying the auth branch to production.
-- Replaces the open policy with user-scoped access control.
-- !! Do NOT run this while the old (no-auth) app is still live !!

drop policy if exists "Allow all for now" on plans;

-- Reading stays open: anyone with the UUID link can view (sharing model)
create policy "Read plans by link"
  on plans for select
  using (true);

-- Writing requires authenticated ownership
create policy "Insert own plans"
  on plans for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Update own plans"
  on plans for update
  using (user_id = auth.uid());

create policy "Delete own plans"
  on plans for delete
  using (user_id = auth.uid());
