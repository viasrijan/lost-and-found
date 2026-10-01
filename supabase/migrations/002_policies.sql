-- 002: policies the app needs for cross-device sync (run once in Supabase SQL editor).
-- 001 only allowed public reads + owner updates; writes were denied, so posts
-- stayed in the browser's localStorage and never appeared on other devices.

-- Profiles: public read (names shown on listings), owners manage their own row.
drop policy if exists "public read profiles" on profiles;
create policy "public read profiles" on profiles for select using (true);
drop policy if exists "users insert own profile" on profiles;
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
drop policy if exists "users update own profile" on profiles;
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Items: owners can always read their own (even claimed/returned).
drop policy if exists "owners read own items" on items;
create policy "owners read own items" on items for select using (auth.uid() = owner_id);

-- Item images: owners can add/remove photos of their own items.
drop policy if exists "owners insert images" on item_images;
create policy "owners insert images" on item_images for insert with check (
  exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid())
);
drop policy if exists "owners delete images" on item_images;
create policy "owners delete images" on item_images for delete using (
  exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid())
);

-- Claims: anyone signed in can claim; claimant + item owner can read; owner decides.
drop policy if exists "auth insert claims" on claims;
create policy "auth insert claims" on claims for insert with check (auth.uid() = claimant_id);
drop policy if exists "involved read claims" on claims;
create policy "involved read claims" on claims for select using (
  auth.uid() = claimant_id
  or exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid())
);
drop policy if exists "owner decides claims" on claims;
create policy "owner decides claims" on claims for update using (
  exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid())
);

-- Conversations: participants manage their own threads.
drop policy if exists "auth create convos" on conversations;
create policy "auth create convos" on conversations for insert with check (
  auth.uid() = a_id or auth.uid() = b_id
);
drop policy if exists "participants read convos" on conversations;
create policy "participants read convos" on conversations for select using (
  auth.uid() = a_id or auth.uid() = b_id
);
drop policy if exists "participants update convos" on conversations;
create policy "participants update convos" on conversations for update using (
  auth.uid() = a_id or auth.uid() = b_id
);

-- Messages: senders post; participants read + mark read.
-- (001 already has select/insert; this adds read-receipt updates.)
drop policy if exists "participants update messages" on messages;
create policy "participants update messages" on messages for update using (
  exists (select 1 from conversations c where c.id = convo_id and (c.a_id = auth.uid() or c.b_id = auth.uid()))
);

-- Storage: public read (bucket is public); signed-in users can upload/manage photos.
drop policy if exists "public read item photos" on storage.objects;
create policy "public read item photos" on storage.objects for select using (bucket_id = 'item-photos');
drop policy if exists "auth upload item photos" on storage.objects;
create policy "auth upload item photos" on storage.objects for insert with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');
drop policy if exists "auth manage item photos" on storage.objects;
create policy "auth manage item photos" on storage.objects for update using (bucket_id = 'item-photos' and auth.role() = 'authenticated');
drop policy if exists "auth delete item photos" on storage.objects;
create policy "auth delete item photos" on storage.objects for delete using (bucket_id = 'item-photos' and auth.role() = 'authenticated');
