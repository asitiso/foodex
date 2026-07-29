-- Applied to the connected Supabase project as migration 20260729233047.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  level integer not null default 1 check (level >= 1),
  total_xp integer not null default 0 check (total_xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_recorded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_records (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_type text not null,
  amount text not null check (amount in ('taste', 'half', 'almostAll')),
  recorded_at timestamptz not null,
  photo_path text,
  client_created_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.food_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meal_records(id) on delete cascade,
  catalog_id text not null,
  name text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  quote text not null,
  xp integer not null check (xp >= 0),
  region_id text not null,
  season_id text,
  evolution_stage integer not null default 1 check (evolution_stage between 1 and 4),
  skin_id text,
  background_id text,
  created_at timestamptz not null,
  unique (user_id, meal_id)
);

create table public.user_rewards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_type text not null check (reward_type in ('skin', 'background', 'event-card', 'fusion-card')),
  reward_id text not null,
  source_type text not null check (source_type in ('set', 'event', 'fusion')),
  source_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, reward_type, reward_id)
);

create table public.fusion_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  left_card_id uuid not null references public.food_cards(id) on delete restrict,
  right_card_id uuid not null references public.food_cards(id) on delete restrict,
  fusion_catalog_id text not null,
  created_at timestamptz not null default now(),
  check (left_card_id <> right_card_id)
);

create index meal_records_user_recorded_idx
  on public.meal_records (user_id, recorded_at desc);
create index food_cards_user_created_idx
  on public.food_cards (user_id, created_at desc);
create index food_cards_meal_id_idx
  on public.food_cards (meal_id);
create index user_rewards_user_id_idx
  on public.user_rewards (user_id);
create index fusion_history_user_created_idx
  on public.fusion_history (user_id, created_at desc);
create index fusion_history_left_card_idx
  on public.fusion_history (left_card_id);
create index fusion_history_right_card_idx
  on public.fusion_history (right_card_id);

alter table public.profiles enable row level security;
alter table public.meal_records enable row level security;
alter table public.food_cards enable row level security;
alter table public.user_rewards enable row level security;
alter table public.fusion_history enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.meal_records to authenticated;
grant select, insert, update, delete on public.food_cards to authenticated;
grant select, insert on public.user_rewards to authenticated;
grant select, insert on public.fusion_history to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "meals_select_own" on public.meal_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "meals_insert_own" on public.meal_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meals_update_own" on public.meal_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "meals_delete_own" on public.meal_records
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "cards_select_own" on public.food_cards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "cards_insert_own" on public.food_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "cards_update_own" on public.food_cards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "cards_delete_own" on public.food_cards
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "rewards_select_own" on public.user_rewards
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "rewards_insert_own" on public.user_rewards
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "fusions_select_own" on public.fusion_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "fusions_insert_own" on public.fusion_history
  for insert to authenticated with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "meal_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "meal_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "meal_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
