create extension if not exists pgcrypto;
create table if not exists serene_migrations (id text primary key, applied_at timestamptz not null default now());

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  username text not null unique,
  password_hash text,
  google_id text unique,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  stars integer not null default 500 check (stars >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  avatar_seed text not null default '',
  avatar_animation text not null default 'float',
  avatar_frame text not null default 'none',
  site_theme text not null default 'white',
  particles text not null default 'dust',
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists sessions_expiry_idx on sessions(expires_at);

create table if not exists stars_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  kind text not null,
  reference_id text,
  created_at timestamptz not null default now()
);
create index if not exists stars_user_created_idx on stars_transactions(user_id, created_at);
create unique index if not exists stars_daily_claim_idx on stars_transactions(user_id, kind, reference_id) where kind = 'daily';

create table if not exists shop_items (
  id text primary key,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  kind text not null,
  value text not null,
  active boolean not null default true
);
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_id text not null references shop_items(id),
  price_paid integer not null check (price_paid >= 0),
  created_at timestamptz not null default now(),
  unique(user_id, item_id)
);

create table if not exists games (id uuid primary key default gen_random_uuid(), title text not null, description text not null, thumbnail text not null default '', url text not null default '', embed_source text not null default '', category text not null, tags jsonb not null default '[]', developer text not null, version text not null default '1.0.0', popularity integer not null default 0, status text not null default 'draft', created_at timestamptz not null default now());
create table if not exists game_submissions (id uuid primary key default gen_random_uuid(), game_id uuid references games(id) on delete cascade, submitted_by uuid not null references users(id), status text not null default 'pending', review_note text, created_at timestamptz not null default now());
create table if not exists apps (id uuid primary key default gen_random_uuid(), name text not null, description text not null, icon text not null default '', url text not null, category text not null, embed_settings jsonb not null default '{}', developer text not null, status text not null default 'draft');
create table if not exists app_submissions (id uuid primary key default gen_random_uuid(), app_id uuid references apps(id) on delete cascade, submitted_by uuid not null references users(id), status text not null default 'pending', created_at timestamptz not null default now());
create table if not exists announcements (id uuid primary key default gen_random_uuid(), title text not null, body text not null, status text not null default 'draft', created_by uuid not null references users(id), published_at timestamptz);
create table if not exists chat_servers (id uuid primary key default gen_random_uuid(), name text not null, icon text not null default '', owner_id uuid not null references users(id));
create table if not exists chat_categories (id uuid primary key default gen_random_uuid(), server_id uuid not null references chat_servers(id) on delete cascade, name text not null, unique(server_id, name));
create table if not exists chat_channels (id uuid primary key default gen_random_uuid(), category_id uuid not null references chat_categories(id) on delete cascade, name text not null, unique(category_id, name));
create table if not exists messages (id uuid primary key default gen_random_uuid(), channel_id uuid not null references chat_channels(id) on delete cascade, author_id uuid not null references users(id), body text not null, created_at timestamptz not null default now());
create table if not exists notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, kind text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now());
create table if not exists bookmarks (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, url text not null, title text not null default '', created_at timestamptz not null default now());
create table if not exists user_settings (user_id uuid primary key references users(id) on delete cascade, settings jsonb not null default '{}', updated_at timestamptz not null default now());

insert into shop_items (id, name, description, price, kind, value) values
  ('theme-hydrochrome', 'Rainbow Hydrochrome', 'A fluid spectral theme.', 450, 'theme', 'hydrochrome'),
  ('theme-pastel', 'Pastel', 'Soft, colorful atmosphere.', 300, 'theme', 'pastel'),
  ('theme-midnight', 'Midnight', 'A darker atmospheric theme.', 250, 'theme', 'midnight'),
  ('theme-red', 'Red', 'A warm red accent theme.', 200, 'theme', 'red'),
  ('theme-blue', 'Blue', 'A cool blue accent theme.', 200, 'theme', 'blue'),
  ('theme-purple', 'Purple', 'A violet accent theme.', 200, 'theme', 'purple'),
  ('theme-green', 'Green', 'A quiet green accent theme.', 200, 'theme', 'green'),
  ('theme-pink', 'Pink', 'A soft pink accent theme.', 200, 'theme', 'pink'),
  ('theme-orange', 'Orange', 'A warm orange accent theme.', 200, 'theme', 'orange'),
  ('theme-cyan', 'Cyan', 'A bright cyan accent theme.', 200, 'theme', 'cyan'),
  ('theme-yellow', 'Yellow', 'A golden accent theme.', 200, 'theme', 'yellow'),
  ('particle-spark', 'Spark particles', 'Small responsive sparks.', 180, 'particles', 'spark'),
  ('particle-orbit', 'Orbit particles', 'Slow orbital particles.', 240, 'particles', 'orbit'),
  ('avatar-spin', 'Spin animation', 'A subtle profile animation.', 220, 'avatarAnimation', 'spin'),
  ('frame-orbit', 'Orbit frame', 'A moving profile frame.', 200, 'avatarFrame', 'orbit')
 on conflict (id) do nothing;

insert into serene_migrations (id) values ('0000_serene_foundation') on conflict (id) do nothing;
