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
  on conflict on constraint coin_transactions_user_id_transaction_key_key do nothing
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

revoke all on function public.claim_meal_coins(uuid, text) from public;
revoke all on function public.claim_meal_coins(uuid, text) from anon;
grant execute on function public.claim_meal_coins(uuid, text) to authenticated;
