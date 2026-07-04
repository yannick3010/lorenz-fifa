-- A finished result never un-happens. The football-data API can briefly (or,
-- for the odd fixture, persistently) return a null winner/duration even after a
-- knockout is decided -- e.g. Australia vs Egypt came through as a penalty
-- shootout with winner = null. Because the sync re-runs every few minutes and
-- re-scores finished matches, a null winner would wipe the (already known)
-- advancer and zero out everyone's points on each pass.
--
-- Guard the result columns: once winner / duration / home_score / away_score are
-- set, an UPDATE that would blank them back to null is ignored (the existing
-- value is kept). Real updates -- to an actual value -- pass through untouched.
create or replace function public.preserve_match_result()
returns trigger as $$
begin
  if new.winner is null and old.winner is not null then
    new.winner := old.winner;
  end if;
  if new.duration is null and old.duration is not null then
    new.duration := old.duration;
  end if;
  if new.home_score is null and old.home_score is not null then
    new.home_score := old.home_score;
  end if;
  if new.away_score is null and old.away_score is not null then
    new.away_score := old.away_score;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists preserve_match_result on public.matches;
create trigger preserve_match_result
  before update on public.matches
  for each row execute function public.preserve_match_result();
