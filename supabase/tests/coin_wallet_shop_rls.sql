select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'coin_transactions';

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('coin_transactions', 'user_rewards')
order by tablename, policyname;

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('claim_meal_coins', 'purchase_shop_product')
order by routine_name;

select grantee, routine_name, privilege_type
from information_schema.role_routine_grants
where specific_schema = 'public'
  and routine_name in ('claim_meal_coins', 'purchase_shop_product')
order by routine_name, grantee;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'coin_transactions'
order by indexname;
