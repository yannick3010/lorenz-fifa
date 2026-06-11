-- Add full_name column to profiles so users can be identified by real name
alter table public.profiles add column full_name text;

-- Update the signup trigger to also store full_name from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate leaderboard view to include full_name
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.full_name,
  p.avatar_url,
  coalesce(sum(pr.points_earned), 0) as total_points,
  count(pr.id) filter (where pr.points_earned is not null) as matches_scored,
  count(pr.id) filter (where pr.points_earned = 3) as exact_scores,
  count(pr.id) filter (where pr.points_earned = 2) as correct_differences,
  count(pr.id) filter (where pr.points_earned = 1) as correct_winners,
  count(pr.id) as total_predictions
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
group by p.id, p.display_name, p.full_name, p.avatar_url;
