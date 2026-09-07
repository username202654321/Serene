alter table games add column if not exists source_file text;
create unique index if not exists games_source_file_idx on games(source_file) where source_file is not null;

insert into games (title, description, url, embed_source, source_file, category, tags, developer, version, status)
select source.title, '', source.url, source.url, source.file, 'Imported', '["imported"]'::jsonb, 'Google Drive import', '1.0.0', 'published'
from (values
  ('Alt Single', '/games/altsingle.html', 'altsingle.html'),
  ('Bank Robbery', '/games/Bank%20Robbery.html', 'Bank Robbery.html'),
  ('Capuchin SF', '/games/capuchinsf.html', 'capuchinsf.html'),
  ('Cheese Rolling', '/games/cheeserolling.html', 'cheeserolling.html'),
  ('3', '/games/cl-3.html', 'cl-3.html'),
  ('B', '/games/cl-b.html', 'cl-b.html'),
  ('1', '/games/cl1.html', 'cl1.html'),
  ('1 on 1 Soccer', '/games/cl1on1soccer.html', 'cl1on1soccer.html'),
  ('1v1 LoL', '/games/cl1v1lol.html', 'cl1v1lol.html'),
  ('1v1 Tennis', '/games/cl1v1tennis.html', 'cl1v1tennis.html'),
  ('2DOOM', '/games/cl2doom.html', 'cl2doom.html'),
  ('2D Shooting', '/games/cl2Dshooting.html', 'cl2Dshooting.html'),
  ('3Dash', '/games/cl3dash.html', 'cl3dash.html'),
  ('3Dash Editor', '/games/cl3dasheditor.html', 'cl3dasheditor.html'),
  ('3D Pinball: Space Cadet', '/games/cl3dpinballspacecadet.html', 'cl3dpinballspacecadet.html'),
  ('3 Pandas', '/games/cl3pandas.html', 'cl3pandas.html'),
  ('3 Pandas Brazil', '/games/cl3pandasbrazil.html', 'cl3pandasbrazil.html'),
  ('3 Pandas Fantasy', '/games/cl3pandasfantasy.html', 'cl3pandasfantasy.html'),
  ('3 Pandas Japan', '/games/cl3pandasjapan.html', 'cl3pandasjapan.html'),
  ('3 Pandas Night', '/games/cl3pandasnight.html', 'cl3pandasnight.html'),
  ('Slices 2', '/games/cl3slices2.html', 'cl3slices2.html')
) as source(title, url, file)
where not exists (select 1 from games where source_file = source.file);

insert into serene_migrations (id) values ('0005_drive_game_sources') on conflict (id) do nothing;