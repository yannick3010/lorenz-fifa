-- Knockout fixtures sync from the football-data API with null teams until the
-- bracket resolves. The sync route now omits the team columns when the API
-- doesn't know them yet (so an existing, known matchup is never overwritten with
-- "TBD"). Brand-new rows inserted in that state need a default to satisfy the
-- NOT NULL constraint -- hence 'TBD' as the column default.
alter table public.matches alter column home_team set default 'TBD';
alter table public.matches alter column away_team set default 'TBD';
