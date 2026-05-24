-- ============================================
-- GRIND OR DIE — Supabase Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  objectives text,
  height_cm integer,
  weight_kg decimal(5,2),
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================
-- ACTIVITY CATEGORIES
-- ============================================
create table if not exists activity_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  emoji text not null,
  color text not null,
  order_index integer default 0
);

-- ============================================
-- ACTIVITIES
-- ============================================
create table if not exists activities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  emoji text,
  points integer not null,
  type text check (type in ('positive', 'negative', 'bonus')) not null,
  category_id uuid references activity_categories(id),
  is_default boolean default true,
  can_repeat_daily boolean default false,
  max_per_day integer default 1,
  created_at timestamptz default now()
);

-- ============================================
-- GROUPS
-- ============================================
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  avatar_url text,
  invite_code text unique default upper(substr(md5(random()::text), 1, 8)),
  created_by uuid references profiles(id) not null,
  max_members integer default 10,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Custom points per group per activity
create table if not exists group_activity_overrides (
  group_id uuid references groups(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  custom_points integer not null,
  primary key (group_id, activity_id)
);

-- ============================================
-- ACTIVITY LOGS
-- ============================================
create table if not exists activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  activity_id uuid references activities(id) not null,
  points_earned integer not null,
  multiplier decimal(3,2) default 1.0,
  notes text,
  logged_at timestamptz default now()
);

-- ============================================
-- USER OBJECTIVES
-- ============================================
create table if not exists user_objectives (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  activity_id uuid references activities(id),
  target_count integer not null default 1,
  period text check (period in ('daily', 'weekly')) default 'weekly',
  multiplier decimal(3,2) default 1.5,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================
-- WEIGHT LOGS
-- ============================================
create table if not exists weight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  weight_kg decimal(5,2) not null,
  logged_at timestamptz default now()
);

-- ============================================
-- STREAKS
-- ============================================
create table if not exists user_streaks (
  user_id uuid references profiles(id) on delete cascade primary key,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_completed_date date,
  updated_at timestamptz default now()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Remove duplicate activities created by re-running older seeds, then prevent new ones.
with ranked_activities as (
  select
    id,
    first_value(id) over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as rn
  from activities
)
update activity_logs l
set activity_id = r.keep_id
from ranked_activities r
where l.activity_id = r.id and r.rn > 1;

with ranked_activities as (
  select
    id,
    first_value(id) over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as rn
  from activities
)
update user_objectives o
set activity_id = r.keep_id
from ranked_activities r
where o.activity_id = r.id and r.rn > 1;

with ranked_activities as (
  select
    id,
    row_number() over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as rn
  from activities
)
delete from group_activity_overrides o
using ranked_activities r
where o.activity_id = r.id and r.rn > 1;

with ranked_activities as (
  select
    id,
    row_number() over (
      partition by lower(trim(name)), coalesce(category_id::text, '')
      order by created_at asc, id asc
    ) as rn
  from activities
)
delete from activities a
using ranked_activities r
where a.id = r.id and r.rn > 1;

create unique index if not exists activities_unique_name_category
  on activities (lower(trim(name)), coalesce(category_id::text, ''));

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table profiles enable row level security;
alter table activity_categories enable row level security;
alter table activities enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_activity_overrides enable row level security;
alter table activity_logs enable row level security;
alter table user_objectives enable row level security;
alter table weight_logs enable row level security;
alter table user_streaks enable row level security;
alter table notifications enable row level security;

-- Drop existing policies before recreating
drop policy if exists "Public profiles visible" on profiles;
drop policy if exists "Users update own profile" on profiles;
drop policy if exists "Users insert own profile" on profiles;
drop policy if exists "Categories public" on activity_categories;
drop policy if exists "Activities public" on activities;
drop policy if exists "Authenticated can create" on activities;
drop policy if exists "Authenticated can update" on activities;
drop policy if exists "Authenticated can delete" on activities;
drop policy if exists "Group members can view" on groups;
drop policy if exists "Authenticated can create groups" on groups;
drop policy if exists "Admin can update group" on groups;
drop policy if exists "Members can view group members" on group_members;
drop policy if exists "Users can join groups" on group_members;
drop policy if exists "Users can leave groups" on group_members;
drop policy if exists "Logs public" on activity_logs;
drop policy if exists "Users create own logs" on activity_logs;
drop policy if exists "Users delete own logs" on activity_logs;
drop policy if exists "Own objectives" on user_objectives;
drop policy if exists "Own weight logs" on weight_logs;
drop policy if exists "Streaks public" on user_streaks;
drop policy if exists "Own streak write" on user_streaks;
drop policy if exists "Own notifications" on notifications;

-- Profiles: public read, own write
create policy "Public profiles visible" on profiles for select using (true);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Activity categories: public read
create policy "Categories public" on activity_categories for select using (true);

-- Activities: public read, authenticated write
create policy "Activities public" on activities for select using (true);
create policy "Authenticated can create" on activities for insert with check (auth.uid() is not null);
create policy "Authenticated can update" on activities for update using (auth.uid() is not null);
create policy "Authenticated can delete" on activities for delete using (auth.uid() is not null);

-- Groups: members can see their groups
create policy "Group members can view" on groups for select using (
  created_by = auth.uid()
  or exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid())
);
create policy "Authenticated can create groups" on groups for insert with check (auth.uid() = created_by);
create policy "Admin can update group" on groups for update using (
  exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid() and role = 'admin')
);

-- Group members
create policy "Members can view group members" on group_members for select using (
  user_id = auth.uid()
  or exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
);
create policy "Users can join groups" on group_members for insert with check (
  auth.uid() = user_id
  or exists (
    select 1
    from group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  )
);
create policy "Users can leave groups" on group_members for delete using (auth.uid() = user_id);

-- Activity logs: public read (for leaderboards), own write
create policy "Logs public" on activity_logs for select using (true);
create policy "Users create own logs" on activity_logs for insert with check (auth.uid() = user_id);
create policy "Users delete own logs" on activity_logs for delete using (auth.uid() = user_id);

-- User objectives: own
create policy "Own objectives" on user_objectives for all using (auth.uid() = user_id);

-- Weight logs: own
create policy "Own weight logs" on weight_logs for all using (auth.uid() = user_id);

-- Streaks: public read, own write
create policy "Streaks public" on user_streaks for select using (true);
create policy "Own streak write" on user_streaks for all using (auth.uid() = user_id);

-- Notifications: own
create policy "Own notifications" on notifications for all using (auth.uid() = user_id);

-- ============================================
-- SEED DATA — Categories
-- ============================================
insert into activity_categories (name, emoji, color, order_index) values
  ('Fitness', '🏋️', '#22c55e', 0),
  ('Nutrition', '🥗', '#f59e0b', 1),
  ('Sommeil', '😴', '#6366f1', 2),
  ('Études', '📚', '#3b82f6', 3),
  ('Dev perso', '🧠', '#8b5cf6', 4),
  ('Looksmax', '💅', '#ec4899', 5),
  ('Entrepreneuriat', '💼', '#f97316', 6)
on conflict (name) do nothing;

-- ============================================
-- SEED DATA — Default Activities
-- ============================================
do $$
declare
  fitness_id uuid;
  nutrition_id uuid;
  sommeil_id uuid;
  etudes_id uuid;
  devperso_id uuid;
  looksmax_id uuid;
  entrepreneuriat_id uuid;
begin
  select id into fitness_id from activity_categories where name = 'Fitness';
  select id into nutrition_id from activity_categories where name = 'Nutrition';
  select id into sommeil_id from activity_categories where name = 'Sommeil';
  select id into etudes_id from activity_categories where name = 'Études';
  select id into devperso_id from activity_categories where name = 'Dev perso';
  select id into looksmax_id from activity_categories where name = 'Looksmax';
  select id into entrepreneuriat_id from activity_categories where name = 'Entrepreneuriat';

  -- FITNESS
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('Salle de sport', '🏋️', 5, 'positive', fitness_id, false, 1),
    ('1km course à pied', '🏃', 1, 'positive', fitness_id, true, 15),
    ('2km de vélo', '🚴', 1, 'positive', fitness_id, true, 20),
    ('10K steps', '🚶', 2, 'positive', fitness_id, false, 1),
    ('Natation 30min', '🏊', 4, 'positive', fitness_id, false, 1),
('50 pompes', '💪', 2, 'positive', fitness_id, true, 3),
    ('Stretching 15min', '🧘', 1, 'positive', fitness_id, false, 1),
    ('Sport collectif', '⚽', 3, 'positive', fitness_id, false, 1),
    ('10km course', '🏅', 5, 'positive', fitness_id, false, 1)
  on conflict do nothing;

  -- NUTRITION
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('3L d''eau', '💧', 2, 'positive', nutrition_id, false, 1),
    ('Repas sain', '🥗', 7, 'positive', nutrition_id, true, 3),
    ('Jeûne intermittent', '⏰', 3, 'positive', nutrition_id, false, 1),
    ('Deliveroo', '🛵', -5, 'negative', nutrition_id, false, 1),
    ('Cheat meal', '🍔', -5, 'negative', nutrition_id, false, 1)
  on conflict do nothing;

  -- SOMMEIL
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
('Réveil avant 9h', '⏰', 2, 'positive', sommeil_id, false, 1),
    ('Coucher avant 01h', '🌙', 5, 'positive', sommeil_id, false, 1),
    ('Sieste 20min', '💤', 1, 'positive', sommeil_id, false, 1),
    ('Moins de 6h sommeil', '😵', -3, 'negative', sommeil_id, false, 1),
    ('+10h sommeil', '🛌', -3, 'negative', sommeil_id, false, 1),
    ('Couché après 01h', '🌃', -2, 'negative', sommeil_id, false, 1),
    ('11h30-13h30 / 19h-21h', '📵', -2, 'negative', sommeil_id, false, 1)
  on conflict do nothing;

  -- ÉTUDES
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('Réviser 2h', '📚', 4, 'positive', etudes_id, true, 4),
    ('Cours en ligne', '💻', 3, 'positive', etudes_id, true, 3),
    ('15min lecture', '📖', 2, 'positive', etudes_id, false, 1),
    ('Flashcards', '📝', 1, 'positive', etudes_id, true, 3),
    ('Finir un module', '🎓', 4, 'positive', etudes_id, true, 2)
  on conflict do nothing;

  -- DEV PERSO
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('Méditation 10min', '🧘', 2, 'positive', devperso_id, false, 1),
    ('Journal', '📓', 2, 'positive', devperso_id, false, 1),
    ('Douche froide', '🚿', 3, 'positive', devperso_id, false, 1),
    ('Podcast éducatif', '🎧', 1, 'positive', devperso_id, true, 2),
    ('Visualisation', '🎯', 1, 'positive', devperso_id, false, 1),
    ('Pas de réseaux sociaux', '📵', 3, 'positive', devperso_id, false, 1),
    ('Temps écran 3h+', '📺', -3, 'negative', devperso_id, false, 1),
    ('Temps écran 5h+', '📺', -5, 'negative', devperso_id, false, 1),
    ('Temps écran 7h+', '📺', -7, 'negative', devperso_id, false, 1),
    ('Réseaux sociaux 2h+', '📱', -3, 'negative', devperso_id, false, 1)
  on conflict do nothing;

  -- LOOKSMAX
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('Skincare routine', '🧴', 2, 'positive', looksmax_id, false, 1),
    ('Hygiène complète', '🦷', 2, 'positive', looksmax_id, false, 1),
    ('Compléments alimentaires', '💊', 1, 'positive', looksmax_id, false, 1)
  on conflict do nothing;

  -- ENTREPRENEURIAT
  insert into activities (name, emoji, points, type, category_id, can_repeat_daily, max_per_day) values
    ('Travailler 1h sur projet', '💼', 3, 'positive', entrepreneuriat_id, true, 8),
    ('Travailler 2h+ sur projet', '🚀', 5, 'bonus', entrepreneuriat_id, false, 1),
    ('Networking', '🤝', 2, 'positive', entrepreneuriat_id, true, 5),
    ('Appel client/prospect', '📞', 4, 'positive', entrepreneuriat_id, true, 10),
    ('Publier du contenu', '📱', 3, 'positive', entrepreneuriat_id, true, 3),
    ('Veille marché', '📊', 2, 'positive', entrepreneuriat_id, false, 1),
    ('Revenue généré', '💰', 10, 'bonus', entrepreneuriat_id, true, 100),
    ('5 cold emails envoyés', '📧', 3, 'positive', entrepreneuriat_id, false, 1),
    ('Objectif du jour accompli', '✅', 5, 'bonus', entrepreneuriat_id, false, 1)
  on conflict do nothing;
end $$;

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)))
  on conflict (id) do nothing;

  insert into user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- FUNCTION: Join group by invite code (bypasses RLS for non-members)
-- ============================================
create or replace function join_group_by_code(invite_code_input text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id     uuid;
  v_max_members  integer;
  v_member_count integer;
  v_user_id      uuid := auth.uid();
begin
  if v_user_id is null then
    return json_build_object('error', 'Non authentifié');
  end if;

  select id, max_members into v_group_id, v_max_members
  from groups
  where invite_code = upper(trim(invite_code_input));

  if v_group_id is null then
    return json_build_object('error', 'Code invalide');
  end if;

  select count(*) into v_member_count
  from group_members where group_id = v_group_id;

  if v_member_count >= v_max_members then
    return json_build_object('error', 'Groupe complet (10 membres max)');
  end if;

  if exists (
    select 1 from group_members
    where group_id = v_group_id and user_id = v_user_id
  ) then
    return json_build_object('error', 'Tu es déjà dans ce groupe');
  end if;

  insert into group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'member');

  return json_build_object('success', true);
end;
$$;

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_logged_at on activity_logs(logged_at desc);
create index if not exists idx_activity_logs_user_date on activity_logs(user_id, logged_at desc);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_group_members_group on group_members(group_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
