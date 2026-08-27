// Database types based on Supabase schema

/** Une entrée « coup tordu » affichée dans la synthèse (bonus mis en avant). */
export type BonusNarrativeEntry = {
  coachName: string
  bonusTypeLabel: string
  narrative: string
}

/** Bloc narratif bonus (dashboard / épisode). */
export type BonusHighlightBlock = {
  title: string
  entries: BonusNarrativeEntry[]
}

export interface League {
  id: string
  name: string
  slug: string
  created_at: string | null
}

export interface Season {
  id: string
  league_id: string
  name: string
  is_current: boolean | null
  is_finished: boolean | null
  created_at: string | null
  total_matchdays: number | null
}

export interface Manager {
  id: string
  league_id: string
  name: string
  avatar_url: string | null
  identity_label: string | null
  created_at: string | null
}

export interface Team {
  id: string
  manager_id: string
  season_id: string
  name: string
  current_rank: number | null
  created_at: string | null
}

export interface Matchday {
  id: string
  season_id: string
  number: number
  title: string | null
  status: string | null
  created_at: string | null
  /** Optionnel : colonne éditoriale si présente en base. */
  punchline?: string | null
}

export interface Match {
  id: string
  matchday_id: string
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  summary: string | null
  hero_name: string | null
  flop_name: string | null
  created_at: string | null
}

/** Ligne pour le dialogue « scores de la J » (`Match`, `MatchResult`, etc.). */
export type MatchdayScoresRow = Pick<
  Match,
  "id" | "home_team_id" | "away_team_id" | "home_score" | "away_score"
>

export interface StandingsHistory {
  id: string
  season_id: string
  manager_id: string
  matchday_number: number
  rank: number
  points: number | null
  goals_for: number | null
  goals_against: number | null
  form: string | null
  /** Matchs joués jusqu’à cette journée (dérivé des résultats). */
  matches_played?: number | null
  /** Série de victoires active en fin de période (dérivé des matchs). */
  win_streak?: number | null
  /** Série de défaites active en fin de période (dérivé des matchs). */
  lose_streak?: number | null
  created_at: string | null
}

/**
 * Ligne `matches` telle que renvoyée au dashboard : FK vers `matchdays`, numéro de journée résolu.
 * La colonne SQL est `matchday_id` ; il n’y a pas de `season_id` sur `matches` (saison via `matchdays.season_id`).
 */
export interface MatchResult {
  id: string
  matchday_id: string
  /** Dérivé de `matchdays.number` pour la journée liée (calcul / tri / validation). */
  matchday_number: number
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  created_at: string | null
}

/**
 * Match normalisé après validation (`validateSeasonMatchResults`).
 * Utilisé uniquement pour le calcul du classement — pas de lecture directe des lignes brutes si invalides.
 */
export type ValidatedMatchRow = {
  matchday_number: number
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
}

/**
 * État des données `matches` pour le dashboard (source de vérité unique pour le classement).
 * - `empty` : aucun match — pas d’erreur, en attente de saisie.
 * - `ready` : validation OK, `standingsHistory` et KPIs dérivés des matchs.
 * - `invalid` : au moins une erreur — pas de classement affiché (pas de repli sur d’autres tables).
 * - `load_error` : échec de lecture Supabase sur `matches`.
 */
export type DashboardMatchDataStatus = "empty" | "ready" | "invalid" | "load_error"

export interface NarrativeKpi {
  id: string
  season_id: string
  slug: string
  title: string
  manager_id: string | null
  stat_value: string | null
  description: string | null
  created_at: string | null
  // Joined data
  manager?: Manager
}

export interface Article {
  id: string
  season_id: string
  category: string
  title: string
  excerpt: string | null
  content: string | null
  featured: boolean | null
  published_at: string | null
  created_at: string | null
}

export interface TimelineEvent {
  id: string
  season_id: string
  matchday_number: number | null
  title: string
  description: string | null
  icon: string | null
  created_at: string | null
}

// Extended types with relations
export interface ManagerWithTeam extends Manager {
  team?: Team
}

/** Carte « trombinoscope » page Managers (stats + palmarès + lore). */
export interface ManagerCard {
  id: string
  name: string
  /** Nom affiché en titre de carte (entraîneur). */
  coachName: string
  teamName: string
  /** Libellé pour palmarès & lore (`identity_label` ou repli sur le nom d’équipe). */
  loreTeamName: string
  currentLeague: "L1" | "L2"
  rank: number | null
  points: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  matchesPlayed: number | null
  form: string | null
  winStreak: number
  loseStreak: number
  loreTag: string | null
  loreDescription: string | null
  palmares: {
    l1Titles: number
    l2Titles: number
    relegations: number
    promotions: number
  }
}

export interface StandingsHistoryWithManager extends StandingsHistory {
  manager?: Manager
}

// Dashboard data type
export interface DashboardData {
  league: League | null
  season: Season | null
  /** All leagues (for switcher); empty if listing failed. */
  allLeagues: League[]
  managers: ManagerWithTeam[]
  /**
   * Classement / historique : **toujours** dérivé des matchs validés (`validatedMatchRows`).
   * Vide si `matchDataStatus` ≠ `ready`. La table SQL `standings_history` n’est plus lue pour cette page.
   */
  standingsHistory: StandingsHistoryWithManager[]
  /** Lignes lues dans `matches` (brut). */
  matchResults: MatchResult[]
  /** Sous-ensemble validé ; utilisé pour KPIs et calcul — vide si invalide ou vide. */
  validatedMatchRows: ValidatedMatchRow[]
  matchDataStatus: DashboardMatchDataStatus
  /** Messages utilisateur (validation ou chargement). */
  matchDataIssues: string[]
  /** Erreur technique de lecture de la table `matches`, si présente. */
  matchesLoadError: string | null
  articles: Article[]
  timelineEvents: TimelineEvent[]
  /**
   * Journée « courante » pour le storytelling : dérivée des matchs si `ready`, sinon null.
   * La table `matchdays` n’est plus chargée pour le dashboard principal.
   */
  currentMatchday: Matchday | null
  /** Punchline (`punchlines.text` pour `season_id` + `matchday_number` courants), si présente. */
  matchdayPunchlineFromTable: string | null
  /** Bonus MPG saisi pour la journée courante (au plus un bloc narratif priorisé). */
  bonusHighlight: BonusHighlightBlock | null
  /** Nombre max de journées prévues (calendrier `matchdays`) pour fin de saison / titres dynamiques. */
  totalMatchdays: number | null
  /**
   * Bonus `highlight = true` pour la journée courante (brut, avant agrégation narrative).
   * Même lot que celui passé à `computeMatchdayBonusHighlight`.
   */
  matchdayHighlightedBonuses: Array<{
    match_id: string
    manager_id: string
    bonus_type: string
    bonus_outcome: string
    created_at?: string | null
    highlight?: boolean | null
  }>
  seasonRecap: SeasonRecap | null
}

export type SeasonRecap = {
  l1Champion: Manager | null
  l1RunnerUp: Manager | null
  l1Relegated: Manager[]
  l2Champion: Manager | null
  l2Promoted: Manager[]
  topScorer: { manager: Manager; goals: number } | null
  bestDefense: { manager: Manager; goalsAgainst: number } | null
  biggestWin: { home: string; away: string; homeScore: number; awayScore: number } | null
}
