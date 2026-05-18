ALTER TABLE public.matches
ADD CONSTRAINT matches_unique_matchday_teams
UNIQUE (matchday_id, home_team_id, away_team_id);
