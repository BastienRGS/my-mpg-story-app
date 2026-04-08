-- Punchlines éditoriales : une ligne par (saison, journée)
CREATE TABLE IF NOT EXISTS punchlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL CHECK (matchday_number >= 1),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (season_id, matchday_number)
);

CREATE INDEX IF NOT EXISTS idx_punchlines_season_j ON punchlines(season_id, matchday_number);
