-- Replace the "most-picked score" aggregate with a consensus spread.
--
-- The crowd's exact-scoreline mode was noisy and rarely meaningful. Instead we
-- now expose a Vegas-style spread: the average goal margin across every
-- submitted pick (home_score - away_score). Positive favours the home team,
-- negative favours the away team. The UI turns this into "Team -X.X".
--
-- Like the rest of get_match_line(), this is an aggregate only -- individual
-- picks stay private until kickoff (see RLS on public.predictions). The
-- minimum-sample threshold still gates every column except total_picks.
--
-- The return signature changes (modal_* -> avg_margin), so the old function is
-- dropped before being recreated.
drop function if exists public.get_match_line(bigint);

create or replace function public.get_match_line(p_match_id bigint)
returns table (
  total_picks integer,
  home_win_count integer,
  draw_count integer,
  away_win_count integer,
  avg_margin numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_min_picks constant integer := 2;
  v_total integer;
begin
  select count(*) into v_total
  from public.predictions
  where match_id = p_match_id;

  total_picks := v_total;

  -- Below the threshold the line is not revealed.
  if v_total < v_min_picks then
    return next;
    return;
  end if;

  select
    count(*) filter (where home_score > away_score),
    count(*) filter (where home_score = away_score),
    count(*) filter (where home_score < away_score),
    -- Average margin, rounded to one decimal for a clean spread number.
    round(avg(home_score - away_score)::numeric, 1)
  into home_win_count, draw_count, away_win_count, avg_margin
  from public.predictions
  where match_id = p_match_id;

  return next;
end;
$$;

grant execute on function public.get_match_line(bigint) to authenticated;
