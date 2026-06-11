-- ============================================================
-- HobbyConnect — Initial Schema
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id              uuid        references auth.users(id) on delete cascade primary key,
  username        text        unique not null,
  full_name       text,
  avatar_url      text,
  bio             text,
  reputation_score numeric    default 5.0,
  total_ratings   int         default 0,
  city            text        default 'Barranquilla',
  created_at      timestamptz default now()
);

create table public.categories (
  id    uuid  primary key default gen_random_uuid(),
  name  text  not null,
  emoji text  not null,
  color text  not null
);

create table public.activities (
  id               uuid        primary key default gen_random_uuid(),
  creator_id       uuid        references public.profiles(id) on delete cascade,
  category_id      uuid        references public.categories(id),
  title            text        not null,
  description      text,
  location_name    text        not null,
  location_address text,
  lat              numeric     not null,
  lng              numeric     not null,
  scheduled_at     timestamptz not null,
  max_participants int         default 10,
  is_free          boolean     default true,
  cost             numeric,
  status           text        default 'open'
                   check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at       timestamptz default now()
);

create table public.activity_participants (
  activity_id uuid        references public.activities(id) on delete cascade,
  user_id     uuid        references public.profiles(id)   on delete cascade,
  joined_at   timestamptz default now(),
  primary key (activity_id, user_id)
);

create table public.ratings (
  id          uuid    primary key default gen_random_uuid(),
  rater_id    uuid    references public.profiles(id) on delete cascade,
  rated_id    uuid    references public.profiles(id) on delete cascade,
  activity_id uuid    references public.activities(id) on delete cascade,
  score       int     not null check (score between 1 and 5),
  comment     text,
  created_at  timestamptz default now(),
  unique (rater_id, rated_id, activity_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.activities (creator_id);
create index on public.activities (category_id);
create index on public.activities (scheduled_at);
create index on public.activities (status);
create index on public.activity_participants (user_id);
create index on public.ratings (rated_id);

-- ============================================================
-- TRIGGER — auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    -- use email prefix as default username; trim to 30 chars
    substring(split_part(new.email, '@', 1) from 1 for 30),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER — recalculate reputation_score on new rating
-- ============================================================

create or replace function public.update_reputation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    reputation_score = (
      select round(avg(score)::numeric, 2)
      from public.ratings
      where rated_id = new.rated_id
    ),
    total_ratings = (
      select count(*)
      from public.ratings
      where rated_id = new.rated_id
    )
  where id = new.rated_id;
  return new;
end;
$$;

create trigger on_rating_inserted
  after insert on public.ratings
  for each row execute procedure public.update_reputation();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles              enable row level security;
alter table public.categories            enable row level security;
alter table public.activities            enable row level security;
alter table public.activity_participants enable row level security;
alter table public.ratings               enable row level security;

-- profiles -------------------------------------------------
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories -----------------------------------------------
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- activities -----------------------------------------------
create policy "Public activities are viewable by everyone"
  on public.activities for select
  using (true);

create policy "Authenticated users can create activities"
  on public.activities for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own activities"
  on public.activities for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Creators can delete their own activities"
  on public.activities for delete
  using (auth.uid() = creator_id);

-- activity_participants ------------------------------------
create policy "Participants are viewable by everyone"
  on public.activity_participants for select
  using (true);

create policy "Authenticated users can join activities"
  on public.activity_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can leave activities they joined"
  on public.activity_participants for delete
  using (auth.uid() = user_id);

-- ratings --------------------------------------------------
create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Authenticated users can submit ratings"
  on public.ratings for insert
  with check (
    auth.uid() = rater_id
    -- cannot rate yourself
    and rater_id <> rated_id
    -- must have participated in the activity
    and exists (
      select 1 from public.activity_participants
      where activity_id = ratings.activity_id
        and user_id = auth.uid()
    )
  );

create policy "Users can update their own ratings"
  on public.ratings for update
  using (auth.uid() = rater_id)
  with check (auth.uid() = rater_id);

create policy "Users can delete their own ratings"
  on public.ratings for delete
  using (auth.uid() = rater_id);

-- ============================================================
-- SEED DATA — categories
-- ============================================================

insert into public.categories (name, emoji, color) values
  ('Fútbol',      '⚽', '#22c55e'),   -- green-500
  ('Tenis',       '🎾', '#eab308'),   -- yellow-500
  ('Baloncesto',  '🏀', '#f97316'),   -- orange-500
  ('Arte',        '🎨', '#a855f7'),   -- purple-500
  ('Música',      '🎵', '#ec4899'),   -- pink-500
  ('Lectura',     '📚', '#3b82f6');   -- blue-500
