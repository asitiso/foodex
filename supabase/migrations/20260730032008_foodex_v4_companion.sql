alter table public.meal_records
  add column if not exists food_name text;

update public.meal_records
set food_name = food_type
where food_name is null or btrim(food_name) = '';

alter table public.meal_records
  alter column food_name set not null;

create table public.dialogue_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dialogue_id text not null,
  event_id text not null,
  opening_id text not null,
  modifier_id text not null,
  used_at timestamptz not null,
  unique (user_id, id)
);

create index dialogue_history_user_used_idx
  on public.dialogue_history (user_id, used_at desc);

alter table public.dialogue_history enable row level security;

grant select, insert on public.dialogue_history to authenticated;

create policy "dialogue_history_select_own"
  on public.dialogue_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "dialogue_history_insert_own"
  on public.dialogue_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
