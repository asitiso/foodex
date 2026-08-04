alter table public.food_cards
  add column if not exists stats jsonb,
  add column if not exists is_shiny boolean not null default false,
  add column if not exists secret_tags text[] not null default '{}';
