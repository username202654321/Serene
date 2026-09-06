create table if not exists browser_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  url text not null,
  title text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists browser_history_user_created_idx on browser_history(user_id, created_at desc);

create table if not exists game_activity (
  user_id uuid not null references users(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  favorite boolean not null default false,
  last_played_at timestamptz,
  primary key (user_id, game_id)
);
