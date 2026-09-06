insert into shop_items (id, name, description, price, kind, value)
select 'particle-' || n, 'Atmosphere ' || lpad(n::text, 3, '0'), 'A subtle Serene particle treatment.', 40 + (n % 8) * 20, 'particles', 'particle-' || n
from generate_series(1, 60) as n
on conflict (id) do nothing;

insert into shop_items (id, name, description, price, kind, value)
select 'animation-' || n, 'Motion Study ' || lpad(n::text, 3, '0'), 'A polished profile motion effect.', 60 + (n % 9) * 25, 'avatarAnimation', 'animation-' || n
from generate_series(1, 45) as n
on conflict (id) do nothing;

insert into shop_items (id, name, description, price, kind, value)
select 'frame-' || n, 'Halo Frame ' || lpad(n::text, 3, '0'), 'A luminous profile frame.', 75 + (n % 7) * 30, 'avatarFrame', 'frame-' || n
from generate_series(1, 45) as n
on conflict (id) do nothing;
