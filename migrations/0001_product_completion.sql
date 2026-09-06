alter table games add column if not exists popularity integer not null default 0;
create unique index if not exists chat_category_name_idx on chat_categories(server_id, name);
create unique index if not exists chat_channel_name_idx on chat_channels(category_id, name);

insert into games (title, description, thumbnail, url, embed_source, category, tags, developer, version, popularity, status) values
  ('Orbital Drift', 'Thread a silent constellation through shifting gravity.', '/manus-storage/serene-games_8d91b126.jpg', '', '', 'Arcade', '["featured","arcade"]', 'Serene', '1.0.0', 98, 'published'),
  ('Stillpoint', 'A slow puzzle about attention, balance, and small moves.', '/manus-storage/serene-browser_6c6017a4.jpg', '', '', 'Puzzle', '["featured","puzzle"]', 'Serene', '1.0.0', 92, 'published'),
  ('Afterimage', 'Read the trace. Move before the light turns over.', '/manus-storage/serene-apps_1b21ef00.jpg', '', '', 'Reflex', '["reflex"]', 'Serene', '1.0.0', 86, 'published'),
  ('Low Tide', 'Shape a quiet shoreline one current at a time.', '/manus-storage/serene-hero_29132c2d.jpg', '', '', 'Strategy', '["strategy"]', 'Serene', '1.0.0', 82, 'published'),
  ('Signal Room', 'Tune a room of fragments into one clear frequency.', '/manus-storage/serene-games_8d91b126.jpg', '', '', 'Logic', '["logic"]', 'Serene', '1.0.0', 74, 'published'),
  ('Monument Valley', 'A small architectural study in perspective and patience.', '/manus-storage/serene-browser_6c6017a4.jpg', '', '', 'Puzzle', '["puzzle"]', 'Serene', '1.0.0', 68, 'published')
 on conflict do nothing;

insert into apps (name, description, icon, url, category, developer, status) values
  ('YouTube', 'Watch YouTube inside Serene when embedding is allowed.', 'youtube', 'https://www.youtube.com', 'Watch', 'Serene', 'published'),
  ('DuckDuckGo', 'Search the web without leaving Serene.', 'search', 'https://duckduckgo.com', 'Search', 'Serene', 'published'),
  ('Wikipedia', 'Read and explore the open encyclopedia.', 'book', 'https://www.wikipedia.org', 'Read', 'Serene', 'published'),
  ('GitHub', 'Browse public repositories where framing is permitted.', 'github', 'https://github.com', 'Build', 'Serene', 'published'),
  ('MDN Web Docs', 'Web platform documentation in a Serene tab.', 'code', 'https://developer.mozilla.org', 'Build', 'Serene', 'published')
 on conflict do nothing;
