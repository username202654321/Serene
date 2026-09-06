create unique index if not exists bookmarks_user_url_idx on bookmarks(user_id, url);
create unique index if not exists browser_history_user_url_idx on browser_history(user_id, url);

create table if not exists message_reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
create index if not exists message_reactions_message_idx on message_reactions(message_id);

alter table profiles add column if not exists banner_color text not null default '#101216';
