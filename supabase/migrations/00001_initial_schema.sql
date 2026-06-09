-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Matches table
create table public.matches (
  id bigint generated always as identity primary key,
  external_id integer unique,
  round text not null,
  match_group text,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  kickoff_time timestamptz not null,
  status text not null default 'TIMED',
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Matches are viewable by all authenticated users"
  on public.matches for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage matches"
  on public.matches for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Predictions table
create table public.predictions (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id bigint references public.matches(id) on delete cascade not null,
  home_score integer not null,
  away_score integer not null,
  points_earned integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.predictions enable row level security;

-- Users can see their own predictions anytime
create policy "Users can view own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

-- Users can see others' predictions only after kickoff
create policy "Users can view others predictions after kickoff"
  on public.predictions for select
  using (
    exists (
      select 1 from public.matches
      where matches.id = predictions.match_id
        and matches.kickoff_time <= now()
    )
  );

-- Users can insert predictions only before kickoff
create policy "Users can insert predictions before kickoff"
  on public.predictions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where matches.id = match_id
        and matches.kickoff_time > now()
    )
  );

-- Users can update predictions only before kickoff
create policy "Users can update own predictions before kickoff"
  on public.predictions for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where matches.id = predictions.match_id
        and matches.kickoff_time > now()
    )
  );

-- Function to calculate points for a prediction
create or replace function public.calculate_points(
  pred_home integer,
  pred_away integer,
  actual_home integer,
  actual_away integer
) returns integer as $$
begin
  -- Exact score
  if pred_home = actual_home and pred_away = actual_away then
    return 3;
  end if;

  -- Correct goal difference
  if (pred_home - pred_away) = (actual_home - actual_away) then
    return 2;
  end if;

  -- Correct winner
  if (
    (pred_home > pred_away and actual_home > actual_away) or
    (pred_home < pred_away and actual_home < actual_away) or
    (pred_home = pred_away and actual_home = actual_away)
  ) then
    return 1;
  end if;

  return 0;
end;
$$ language plpgsql immutable;

-- Function to score all predictions for a finished match
create or replace function public.score_match(p_match_id bigint)
returns void as $$
declare
  v_home_score integer;
  v_away_score integer;
begin
  select home_score, away_score
  into v_home_score, v_away_score
  from public.matches
  where id = p_match_id and status = 'FINISHED';

  if not found then
    raise exception 'Match not found or not finished';
  end if;

  update public.predictions
  set points_earned = public.calculate_points(home_score, away_score, v_home_score, v_away_score),
      updated_at = now()
  where match_id = p_match_id;
end;
$$ language plpgsql security definer;

-- Leaderboard view
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  coalesce(sum(pr.points_earned), 0) as total_points,
  count(pr.id) filter (where pr.points_earned is not null) as matches_scored,
  count(pr.id) filter (where pr.points_earned = 3) as exact_scores,
  count(pr.id) filter (where pr.points_earned = 2) as correct_differences,
  count(pr.id) filter (where pr.points_earned = 1) as correct_winners,
  count(pr.id) as total_predictions
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.display_name, p.avatar_url;
