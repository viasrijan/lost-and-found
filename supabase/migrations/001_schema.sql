-- Lost & Found schema (run in Supabase SQL editor, then wire VITE_ env vars)
create extension if not exists "pg_trgm";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('lost','found')),
  title text not null,
  description text not null,
  category text not null,
  tags text[] default '{}',
  color text default '',
  brand text default '',
  date_event date not null,
  country text not null,
  city text not null,
  area text not null,
  status text not null default 'active' check (status in ('active','claimed','returned','archived')),
  reward text,
  owner_id uuid not null references profiles(id) on delete cascade,
  proof_question text not null,
  handoff_code text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '90 days'
);
create index if not exists items_search_idx on items using gin ((title || ' ' || description || ' ' || category) gin_trgm_ops);
create index if not exists items_geo_idx on items (country, city, created_at desc);

create table if not exists item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  url text not null,
  position int default 0
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  claimant_id uuid not null references profiles(id) on delete cascade,
  answer text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  a_id uuid not null references profiles(id) on delete cascade,
  b_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'request' check (status in ('request','active','blocked')),
  last_msg_at timestamptz default now(),
  unique(item_id, a_id, b_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  convo_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  image_url text,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table items enable row level security;
alter table item_images enable row level security;
alter table claims enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Public: read active items + images
drop policy if exists "public read active items" on items;
create policy "public read active items" on items for select using (status = 'active');
drop policy if exists "public read images" on item_images;
create policy "public read images" on item_images for select using (true);

-- Authenticated: insert own items
drop policy if exists "auth insert own items" on items;
create policy "auth insert own items" on items for insert with check (auth.uid() = owner_id);
drop policy if exists "owner update own items" on items;
create policy "owner update own items" on items for update using (auth.uid() = owner_id);
drop policy if exists "owner delete own items" on items;
create policy "owner delete own items" on items for delete using (auth.uid() = owner_id);

-- Messages: only participants
drop policy if exists "participants read messages" on messages;
create policy "participants read messages" on messages for select using (
  exists (select 1 from conversations c where c.id = convo_id and (c.a_id = auth.uid() or c.b_id = auth.uid()))
);
drop policy if exists "participants send messages" on messages;
create policy "participants send messages" on messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from conversations c where c.id = convo_id and (c.a_id = auth.uid() or c.b_id = auth.uid()))
);

-- Storage bucket (create in Dashboard → Storage): name `item-photos`, public read, 5MB limit, jpg/png/webp only.
