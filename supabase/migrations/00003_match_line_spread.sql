-- Add a consensus spread to the match line, alongside the legacy modal_* cols.
--
-- The crowd's exact-scoreline mode was noisy and rarely meaningful, so the UI
-- now leads with a Vegas-style spread: the average goal margin across every
-- submitted pick (home_score - away_score). Positive favours the home team,
-- negative favours the away team. The UI turns this into "Team -X.X".
--
-- The legacy modal_* columns are kept so the previously-deployed frontend keeps
-- working during rollout; they can be dropped once the spread client is live.
--
-- Like the rest of get_match_line(), this is an aggregate only -- individual
-- picks stay private until kickoff (see RLS on public.predictions). The
-- minimum-sample threshold still gates every column except total_picks.
--
-- The return signature changes (avg_margin added), so the old function is
-- dropped before being recreated.
drop function if exists public.get_match_line(bigint);

create or replace function public.get_match_line(p_match_id bigint)
returns table (
  total_picks integer,
  home_win_count integer,
  draw_count integer,
  away_win_count integer,
  modal_home integer,
  modal_away integer,
  modal_count integer,
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

  -- Legacy most-picked exact scoreline (kept for the pre-spread client).
  select s.home_score, s.away_score, s.cnt
  into modal_home, modal_away, modal_count
  from (
    select home_score, away_score, count(*)::integer as cnt
    from public.predictions
    where match_id = p_match_id
    group by home_score, away_score
    order by cnt desc, home_score desc, away_score desc
    limit 1
  ) s;

  return next;
end;
$$;

grant execute on function public.get_match_line(bigint) to authenticated;
