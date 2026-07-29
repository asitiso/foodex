select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'meal_records', 'food_cards', 'user_rewards', 'fusion_history')
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'meal_records', 'food_cards', 'user_rewards', 'fusion_history')
order by tablename, policyname;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'meal_records_user_recorded_idx',
    'food_cards_user_created_idx',
    'food_cards_meal_id_idx',
    'user_rewards_user_id_idx',
    'fusion_history_user_created_idx',
    'fusion_history_left_card_idx',
    'fusion_history_right_card_idx'
  )
order by indexname;
