-- PRIMARY (dashboard) : résultats liés aux journées, saison portée par `matchdays`.
-- Schéma aligné Supabase réel : pas de `season_id` sur `matches`.

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchday_id UUID NOT NULL REFERENCES matchdays(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_score INT NOT NULL CHECK (home_score >= 0),
  away_score INT NOT NULL CHECK (away_score >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT matches_home_away_distinct CHECK (home_team_id <> away_team_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);

COMMENT ON TABLE matches IS 'Scores par rencontre ; saison implicite via matchdays.season_id.';
