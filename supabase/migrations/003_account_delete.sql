-- 003: let users delete their own account (run once in Supabase SQL editor).
-- Deleting a profiles row cascades: items -> item_images / claims /
-- conversations -> messages, plus claims/convos where they are the claimant
-- or participant. The auth.users row itself can only be removed from the
-- dashboard (Authentication -> Users) or via the admin API.

drop policy if exists "users delete own profile" on profiles;
create policy "users delete own profile" on profiles for delete using (auth.uid() = id);
