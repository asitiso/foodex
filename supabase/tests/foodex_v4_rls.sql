begin;

insert into auth.users (id)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
on conflict (id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true
);

insert into public.dialogue_history (
  id,
  user_id,
  dialogue_id,
  event_id,
  opening_id,
  modifier_id,
  used_at
) values (
  '11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'first-warm-discovery',
  'first-discovery',
  'first-find',
  'warm-bowl',
  now()
);

do $$
begin
  begin
    insert into public.dialogue_history (
      id,
      user_id,
      dialogue_id,
      event_id,
      opening_id,
      modifier_id,
      used_at
    ) values (
      '22222222-2222-4222-8222-222222222222',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'blocked-line',
      'first-discovery',
      'first-find',
      'warm-bowl',
      now()
    );
    raise exception 'RLS allowed a dialogue row for another user';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.dialogue_history;

  if visible_count <> 1 then
    raise exception 'RLS exposed dialogue rows owned by another user';
  end if;
end
$$;

rollback;
