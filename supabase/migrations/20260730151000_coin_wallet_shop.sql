create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_key text not null,
  kind text not null check (kind in ('meal-earned', 'shop-spent')),
  amount integer not null check (
    (kind = 'meal-earned' and amount > 0)
    or (kind = 'shop-spent' and amount < 0)
  ),
  meal_id uuid references public.meal_records(id) on delete cascade,
  product_id text,
  created_at timestamptz not null default now(),
  unique (user_id, transaction_key)
);

create index coin_transactions_user_created_idx
  on public.coin_transactions (user_id, created_at desc);

alter table public.coin_transactions enable row level security;

grant select on public.coin_transactions to authenticated;
revoke all on public.coin_transactions from anon;

create policy "coin_transactions_select_own" on public.coin_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

alter table public.user_rewards
  drop constraint user_rewards_source_type_check;
alter table public.user_rewards
  add constraint user_rewards_source_type_check
  check (source_type in ('set', 'event', 'fusion', 'shop'));

drop policy "rewards_insert_own" on public.user_rewards;
create policy "rewards_insert_own" on public.user_rewards
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and source_type <> 'shop'
  );

revoke insert, update on public.profiles from authenticated;
grant insert (user_id, nickname) on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;

create or replace function public.claim_meal_coins(
  p_meal_id uuid,
  p_transaction_key text
)
returns table (balance integer, awarded integer, transaction_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_recorded_at timestamptz;
  v_position integer;
  v_awarded integer;
  v_inserted boolean := false;
begin
  if v_user_id is null then
    raise exception 'authentication-required';
  end if;
  if p_transaction_key <> 'meal:' || p_meal_id::text || ':coins' then
    raise exception 'invalid-transaction-key';
  end if;

  select recorded_at
    into v_recorded_at
  from public.meal_records
  where id = p_meal_id
    and user_id = v_user_id;

  if v_recorded_at is null then
    raise exception 'meal-not-found';
  end if;

  select count(*)::integer
    into v_position
  from public.meal_records
  where user_id = v_user_id
    and (recorded_at at time zone 'Asia/Seoul')::date
      = (v_recorded_at at time zone 'Asia/Seoul')::date
    and (
      recorded_at < v_recorded_at
      or (recorded_at = v_recorded_at and id <= p_meal_id)
    );

  v_awarded := case when v_position <= 1 then 5 else 8 end;

  insert into public.profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  insert into public.coin_transactions (
    user_id,
    transaction_key,
    kind,
    amount,
    meal_id,
    created_at
  )
  values (
    v_user_id,
    p_transaction_key,
    'meal-earned',
    v_awarded,
    p_meal_id,
    v_recorded_at
  )
  on conflict (user_id, transaction_key) do nothing
  returning true into v_inserted;

  if v_inserted then
    update public.profiles
    set coins = coins + v_awarded,
        updated_at = now()
    where user_id = v_user_id;
  else
    select amount
      into v_awarded
    from public.coin_transactions
    where user_id = v_user_id
      and coin_transactions.transaction_key = p_transaction_key;
  end if;

  return query
  select profiles.coins, v_awarded, p_transaction_key
  from public.profiles
  where profiles.user_id = v_user_id;
end;
$$;

create or replace function public.purchase_shop_product(
  p_product_id text,
  p_transaction_key text
)
returns table (
  balance integer,
  reward_id uuid,
  reward_type text,
  product_id text,
  transaction_key text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_price integer;
  v_reward_type text;
  v_balance integer;
  v_reward_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication-required';
  end if;
  if p_transaction_key !~ '^shop:[0-9a-f-]{36}$' then
    raise exception 'invalid-transaction-key';
  end if;

  select catalog.price, catalog.reward_type
    into v_price, v_reward_type
  from (
    values
      ('shop-sunroom'::text, 20, 'background'::text),
      ('shop-moonroom'::text, 30, 'background'::text),
      ('shop-star-pin'::text, 15, 'skin'::text),
      ('shop-leaf-crown'::text, 25, 'skin'::text)
  ) as catalog(product_id, price, reward_type)
  where catalog.product_id = p_product_id;

  if v_price is null then
    raise exception 'product-not-found';
  end if;

  insert into public.profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select coins
    into v_balance
  from public.profiles
  where user_id = v_user_id
  for update;

  select id
    into v_reward_id
  from public.user_rewards
  where user_id = v_user_id
    and user_rewards.reward_type = v_reward_type
    and user_rewards.reward_id = p_product_id;

  if v_reward_id is not null then
    return query select v_balance, v_reward_id, v_reward_type, p_product_id, p_transaction_key;
    return;
  end if;

  select user_rewards.id
    into v_reward_id
  from public.coin_transactions
  join public.user_rewards
    on user_rewards.user_id = coin_transactions.user_id
    and user_rewards.source_type = 'shop'
    and user_rewards.source_id = coin_transactions.product_id
  where coin_transactions.user_id = v_user_id
    and coin_transactions.transaction_key = p_transaction_key;

  if v_reward_id is not null then
    return query select v_balance, v_reward_id, v_reward_type, p_product_id, p_transaction_key;
    return;
  end if;

  if v_balance < v_price then
    raise exception 'insufficient-coins';
  end if;

  v_reward_id := gen_random_uuid();
  insert into public.coin_transactions (
    user_id,
    transaction_key,
    kind,
    amount,
    product_id
  )
  values (
    v_user_id,
    p_transaction_key,
    'shop-spent',
    -v_price,
    p_product_id
  );

  insert into public.user_rewards (
    id,
    user_id,
    reward_type,
    reward_id,
    source_type,
    source_id
  )
  values (
    v_reward_id,
    v_user_id,
    v_reward_type,
    p_product_id,
    'shop',
    p_product_id
  );

  update public.profiles
  set coins = coins - v_price,
      updated_at = now()
  where user_id = v_user_id
  returning coins into v_balance;

  return query select v_balance, v_reward_id, v_reward_type, p_product_id, p_transaction_key;
end;
$$;

revoke all on function public.claim_meal_coins(uuid, text) from public;
revoke all on function public.claim_meal_coins(uuid, text) from anon;
grant execute on function public.claim_meal_coins(uuid, text) to authenticated;

revoke all on function public.purchase_shop_product(text, text) from public;
revoke all on function public.purchase_shop_product(text, text) from anon;
grant execute on function public.purchase_shop_product(text, text) to authenticated;
