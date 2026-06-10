-- Estimated "line" for a match, derived from submitted predictions.
--
-- Picks stay private until kickoff (see RLS on public.predictions), so the
-- line must be computed server-side as an aggregate only. This SECURITY
-- DEFINER function bypasses RLS to read all picks for a match but returns
-- ONLY summary numbers -- never individual rows, scores, or user ids.
--
-- A minimum-sample threshold protects against tiny samples: below the
-- threshold only total_picks is returned and every other column is null.
-- Set to 2 -- the line is revealed once at least two players have picked.
create or replace function public.get_match_line(p_match_id bigint)
returns table (
  total_picks integer,
  home_win_count integer,
  draw_count integer,
  away_win_count integer,
  modal_home integer,
  modal_away integer,
  modal_count integer
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
    count(*) filter (where home_score < away_score)
  into home_win_count, draw_count, away_win_count
  from public.predictions
  where match_id = p_match_id;

  -- Most-frequently picked exact scoreline (ties broken deterministically).
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
