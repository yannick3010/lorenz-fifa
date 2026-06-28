-- Knockout games can't end level: a draw after 90 minutes goes to extra time
-- and, if still level, a penalty shootout. For these matches a prediction is
-- two parts: the 90-minute scoreline and -- when that scoreline is a draw --
-- which team the user thinks advances. Points are awarded on the 90-minute
-- result plus who progresses, never on extra-time or shootout goals.

-- Who the user thinks advances when they predict a knockout draw ('HOME'/'AWAY').
-- Null for decisive picks and for every group-stage prediction.
alter table public.predictions
  add column advance_pick text
  check (advance_pick in ('HOME', 'AWAY'));

-- Result metadata from the football-data API, needed to score knockouts.
--   winner:   'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW'
--   duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
-- home_score/away_score now hold the 90-minute (regulation) score in every
-- round, so the displayed/scored line never includes shootout goals.
alter table public.matches add column winner text;
alter table public.matches add column duration text;

-- Knockout scoring. Inputs:
--   pred_home/pred_away : the user's predicted 90-minute scoreline
--   p_advance_pick      : 'HOME'/'AWAY' the user picked to advance (draw picks)
--   reg_home/reg_away   : actual 90-minute score
--   p_advancer          : 'HOME'/'AWAY' the team that actually advanced
--   p_went_to_et        : true if the match went past 90 minutes (level at 90)
create or replace function public.calculate_points_knockout(
  pred_home integer,
  pred_away integer,
  p_advance_pick text,
  reg_home integer,
  reg_away integer,
  p_advancer text,
  p_went_to_et boolean
) returns integer as $$
declare
  pred_decisive boolean := pred_home <> pred_away;
  pred_winner text := case
    when pred_home > pred_away then 'HOME'
    when pred_home < pred_away then 'AWAY'
    else null
  end;
begin
  if p_went_to_et then
    -- Level at 90; advancer decided in extra time / penalties.
    if pred_decisive then
      -- Predicted a regulation win that didn't happen: credit only if the
      -- predicted winner is the team that ultimately advanced.
      return case when pred_winner = p_advancer then 1 else 0 end;
    else
      -- Predicted a draw + an advancer.
      if p_advance_pick is distinct from p_advancer then
        return 0;                                  -- wrong team through
      elsif pred_home = reg_home and pred_away = reg_away then
        return 3;                                  -- exact draw + correct advancer
      else
        return 2;                                  -- right that it was a draw
      end if;
    end if;
  else
    -- Decided inside 90 minutes; advancer is the regulation winner.
    if pred_decisive then
      if pred_home = reg_home and pred_away = reg_away then
        return 3;
      elsif (pred_home - pred_away) = (reg_home - reg_away) then
        return 2;
      elsif pred_winner = p_advancer then
        return 1;
      else
        return 0;
      end if;
    else
      -- Predicted a draw that didn't happen: credit only if the team the user
      -- picked to advance won outright.
      return case when p_advance_pick = p_advancer then 1 else 0 end;
    end if;
  end if;
end;
$$ language plpgsql immutable;

-- Score every prediction for a finished match. Group games use the plain
-- scoreline rule; knockouts use the advancer-aware rule above.
create or replace function public.score_match(p_match_id bigint)
returns void as $$
declare
  m record;
  v_is_knockout boolean;
  v_advancer text;
  v_went_to_et boolean;
begin
  select home_score, away_score, status, match_group, winner, duration
  into m
  from public.matches
  where id = p_match_id;

  if not found or m.status <> 'FINISHED' then
    raise exception 'Match not found or not finished';
  end if;

  v_is_knockout := m.match_group is null;
  v_advancer := case m.winner
    when 'HOME_TEAM' then 'HOME'
    when 'AWAY_TEAM' then 'AWAY'
    else null
  end;
  v_went_to_et := coalesce(m.duration in ('EXTRA_TIME', 'PENALTY_SHOOTOUT'), false);

  -- Defensive fallback: if the API didn't report a winner, infer the advancer
  -- from the regulation score so knockouts still score sensibly.
  if v_is_knockout and v_advancer is null then
    v_advancer := case
      when m.home_score > m.away_score then 'HOME'
      when m.home_score < m.away_score then 'AWAY'
      else null
    end;
  end if;

  if v_is_knockout then
    update public.predictions p
    set points_earned = public.calculate_points_knockout(
          p.home_score, p.away_score, p.advance_pick,
          m.home_score, m.away_score, v_advancer, v_went_to_et
        ),
        updated_at = now()
    where p.match_id = p_match_id;
  else
    update public.predictions p
    set points_earned = public.calculate_points(
          p.home_score, p.away_score, m.home_score, m.away_score
        ),
        updated_at = now()
    where p.match_id = p_match_id;
  end if;
end;
$$ language plpgsql security definer;
