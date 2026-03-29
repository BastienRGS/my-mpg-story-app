-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_matchday INT DEFAULT 1,
  total_matchdays INT DEFAULT 38,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  avatar TEXT,
  current_rank INT DEFAULT 0,
  identity TEXT,
  identity_label TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LEGACY (dashboard) : le classement de la page ligue est calculé depuis la table `matches` (voir `002_matches_results.sql`).
-- Conserver cette table seulement pour migration manuelle, exports ou outils hors dashboard.

-- Create standings_history table (rankings per matchday)
CREATE TABLE IF NOT EXISTS standings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  matchday INT NOT NULL,
  rank INT NOT NULL,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, manager_id, matchday)
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Analyse', 'Interview', 'Rumeur mercato', 'Tactique')),
  title TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  published_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LEGACY (dashboard) : les cartes KPI de la page ligue sont calculées côté app depuis `matches`.

-- Create narrative_kpis table
CREATE TABLE IF NOT EXISTS narrative_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES managers(id) ON DELETE CASCADE,
  kpi_key TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL,
  stat TEXT NOT NULL,
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  matchday INT NOT NULL,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seasons_league ON seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_managers_season ON managers(season_id);
CREATE INDEX IF NOT EXISTS idx_standings_season ON standings_history(season_id);
CREATE INDEX IF NOT EXISTS idx_standings_matchday ON standings_history(matchday);
CREATE INDEX IF NOT EXISTS idx_articles_season ON articles(season_id);
CREATE INDEX IF NOT EXISTS idx_kpis_season ON narrative_kpis(season_id);
CREATE INDEX IF NOT EXISTS idx_timeline_season ON timeline_events(season_id);
