import { createClient } from '@/lib/supabase/server'
import type {
  League,
  Season,
  Article,
  TimelineEvent,
  Matchday,
  DashboardData,
  ManagerWithTeam,
  StandingsHistoryWithManager,
  MatchResult,
  DashboardMatchDataStatus,
  ValidatedMatchRow,
} from '@/lib/types'
import { computeStandingsHistoryFromMatches, maxMatchdayFromMatches } from '@/lib/compute-standings-from-matches'
import { validateSeasonMatchResults } from '@/lib/match-results-validation'

/** Options for loading dashboard data (multi-league ready). */
export type GetDashboardDataOptions = {
  /** When set, loads that league by `slug`. When omitted, uses default resolution (see `resolveDashboardLeague`). */
  leagueSlug?: string | null
}

export async function listLeagues(): Promise<League[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error listing leagues:', error)
    return []
  }

  return (data ?? []) as League[]
}

export async function getLeagueBySlug(slug: string): Promise<League | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', trimmed)
    .maybeSingle()

  if (error) {
    console.error('Error fetching league by slug:', error)
    return null
  }

  return data as League | null
}

/**
 * Resolves which league to show on the dashboard.
 * - With `leagueSlug`: that league only (if it exists).
 * - Without: all leagues loaded, then `NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG` if set, otherwise first by name.
 */
export async function resolveDashboardLeague(leagueSlug?: string | null): Promise<League | null> {
  if (leagueSlug != null && String(leagueSlug).trim() !== '') {
    return getLeagueBySlug(String(leagueSlug))
  }

  const leagues = await listLeagues()
  if (leagues.length === 0) return null

  const preferred = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG?.trim()
  if (preferred) {
    const match = leagues.find((l) => l.slug === preferred)
    if (match) return match
  }

  return leagues[0]
}

export async function getCurrentSeason(leagueId: string): Promise<Season | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching current season:', error)
  }

  if (data) return data as Season

  const { data: fallback, error: fallbackError } = await supabase
    .from('seasons')
    .select('*')
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fallbackError) {
    console.error('Error fetching fallback season:', fallbackError)
    return null
  }

  return fallback as Season | null
}

export async function getManagers(leagueId: string, seasonId: string): Promise<ManagerWithTeam[]> {
  const supabase = await createClient()

  const { data: managers, error: managersError } = await supabase
    .from('managers')
    .select('*')
    .eq('league_id', leagueId)
    .order('name')

  if (managersError || !managers) {
    console.error('Error fetching managers:', managersError)
    return []
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)

  return managers.map((manager) => ({
    ...manager,
    team: teams?.find((t) => t.manager_id === manager.id) || undefined,
  })) as ManagerWithTeam[]
}

/**
 * @legacy Table `standings_history` — **non utilisée par le dashboard** (`/ligue/[slug]`).
 * Conservée pour scripts de migration ou outils externes uniquement.
 */
export async function getStandingsHistory(seasonId: string): Promise<StandingsHistoryWithManager[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('standings_history')
    .select(`
      *,
      manager:managers(*)
    `)
    .eq('season_id', seasonId)
    .order('matchday_number', { ascending: true })

  if (error) {
    console.error('Error fetching standings history:', error)
    return []
  }

  return (data || []) as StandingsHistoryWithManager[]
}

/**
 * Source de vérité : table **`matches`**, filtrée par saison via **`matchdays`**.
 * Schéma réel : `matches.matchday_id` → `matchdays.id`, `matchdays.season_id` → saison courante.
 * `matchday_number` est résolu depuis `matchdays.number` (pas de colonne `season_id` sur `matches`).
 */
export async function getMatchResults(seasonId: string): Promise<{
  rows: MatchResult[]
  error: string | null
}> {
  const supabase = await createClient()

  const { data: seasonMatchdays, error: mdError } = await supabase
    .from('matchdays')
    .select('id, number')
    .eq('season_id', seasonId)
    .order('number', { ascending: true })

  if (mdError) {
    console.error('Error fetching matchdays for season:', mdError)
    return { rows: [], error: mdError.message || String(mdError) }
  }

  const mds = seasonMatchdays ?? []
  const numberByMatchdayId = new Map(mds.map((m) => [m.id, m.number]))
  const matchdayIds = mds.map((m) => m.id)

  if (matchdayIds.length === 0) {
    return { rows: [], error: null }
  }

  const { data: rawMatches, error: mError } = await supabase
    .from('matches')
    .select('id, matchday_id, home_team_id, away_team_id, home_score, away_score, created_at')
    .in('matchday_id', matchdayIds)

  if (mError) {
    console.error('Error fetching matches:', mError)
    return { rows: [], error: mError.message || String(mError) }
  }

  const rows: MatchResult[] = (rawMatches ?? []).map((m) => {
    const n = numberByMatchdayId.get(m.matchday_id)
    return {
      id: m.id,
      matchday_id: m.matchday_id,
      matchday_number: typeof n === 'number' && Number.isFinite(n) ? n : 0,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: Number(m.home_score),
      away_score: Number(m.away_score),
      created_at: m.created_at ?? null,
    }
  })

  rows.sort((a, b) => {
    if (a.matchday_number !== b.matchday_number) return a.matchday_number - b.matchday_number
    return a.id.localeCompare(b.id)
  })

  return { rows, error: null }
}

export async function getArticles(seasonId: string): Promise<Article[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('season_id', seasonId)
    .order('published_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  return (data || []) as Article[]
}

export async function getTimelineEvents(seasonId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('season_id', seasonId)
    .order('matchday_number', { ascending: true })

  if (error) {
    console.error('Error fetching timeline events:', error)
    return []
  }

  return (data || []) as TimelineEvent[]
}

/**
 * Liste des journées d’une saison (utilitaire / hors `getDashboardData`).
 * Le dashboard résout les matchs via la même table en interne dans `getMatchResults`.
 */
export async function getMatchdays(seasonId: string): Promise<Matchday[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .eq('season_id', seasonId)
    .order('number', { ascending: true })

  if (error) {
    console.error('Error fetching matchdays:', error)
    return []
  }

  return (data || []) as Matchday[]
}

/** @legacy Non utilisé par `getDashboardData` ; calendrier éditorial optionnel hors scope dashboard. */
export async function getCurrentMatchday(seasonId: string): Promise<Matchday | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .eq('season_id', seasonId)
    .in('status', ['completed', 'in_progress'])
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching current matchday:', error)
  }

  if (data) return data as Matchday

  const { data: fallback, error: fallbackError } = await supabase
    .from('matchdays')
    .select('*')
    .eq('season_id', seasonId)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fallbackError) {
    console.error('Error fetching fallback matchday:', fallbackError)
    return null
  }

  return fallback as Matchday | null
}

function normalizeDashboardOptions(
  leagueSlugOrOptions?: string | GetDashboardDataOptions | null
): string | null | undefined {
  if (leagueSlugOrOptions == null) return undefined
  if (typeof leagueSlugOrOptions === 'string') return leagueSlugOrOptions
  return leagueSlugOrOptions.leagueSlug ?? undefined
}

function emptyDashboard(
  allLeagues: League[],
  overrides: Partial<Omit<DashboardData, 'allLeagues'>> = {}
): DashboardData {
  return {
    league: null,
    season: null,
    allLeagues,
    managers: [],
    standingsHistory: [],
    matchResults: [],
    validatedMatchRows: [],
    matchDataStatus: 'empty',
    matchDataIssues: [],
    matchesLoadError: null,
    articles: [],
    timelineEvents: [],
    currentMatchday: null,
    ...overrides,
  }
}

/**
 * Charge le dashboard ligue. **Source de vérité : `matches`** via **`matchdays`** (même saison).
 * N’utilise pas `standings_history` en repli. `matchdays` sert à lier `matches` à la saison et à résoudre le numéro de J.
 *
 * Saisie hebdomadaire : `docs/WEEKLY_WORKFLOW.md` et route `/admin/match-results`.
 *
 * @param leagueSlugOrOptions — slug ou `{ leagueSlug }` ; sinon résolution par défaut (scripts).
 */
export async function getDashboardData(
  leagueSlugOrOptions?: string | GetDashboardDataOptions | null
): Promise<DashboardData> {
  const allLeagues = await listLeagues()
  const leagueSlug = normalizeDashboardOptions(leagueSlugOrOptions)
  const league = await resolveDashboardLeague(leagueSlug)

  if (!league) {
    return emptyDashboard(allLeagues)
  }

  const season = await getCurrentSeason(league.id)

  if (!season) {
    return emptyDashboard(allLeagues, { league, season: null })
  }

  const [managers, matchBundle, articles, timelineEvents] = await Promise.all([
    getManagers(league.id, season.id),
    getMatchResults(season.id),
    getArticles(season.id),
    getTimelineEvents(season.id),
  ])

  const { rows: matchResults, error: matchesLoadError } = matchBundle

  let matchDataStatus: DashboardMatchDataStatus = 'empty'
  let matchDataIssues: string[] = []
  let validatedMatchRows: ValidatedMatchRow[] = []
  let standingsHistory: StandingsHistoryWithManager[] = []
  let currentMatchday: Matchday | null = null

  if (matchesLoadError) {
    matchDataStatus = 'load_error'
    matchDataIssues = [
      `Impossible de charger les résultats (tables « matchdays » / « matches »). Vérifiez le schéma, la migration SQL et les politiques RLS. Détail : ${matchesLoadError}`,
    ]
  } else if (matchResults.length === 0) {
    matchDataStatus = 'empty'
  } else {
    const { issues, validRows } = validateSeasonMatchResults(managers, matchResults)
    if (issues.length > 0) {
      matchDataStatus = 'invalid'
      matchDataIssues = issues
    } else {
      matchDataStatus = 'ready'
      validatedMatchRows = validRows
      standingsHistory = computeStandingsHistoryFromMatches(season.id, managers, validatedMatchRows)
      const n = maxMatchdayFromMatches(validatedMatchRows)
      if (n > 0) {
        currentMatchday = {
          id: `derived-md-${season.id}`,
          season_id: season.id,
          number: n,
          title: null,
          status: 'completed',
          created_at: null,
        }
      }
    }
  }

  return {
    league,
    season,
    allLeagues,
    managers,
    standingsHistory,
    matchResults,
    validatedMatchRows,
    matchDataStatus,
    matchDataIssues,
    matchesLoadError,
    articles,
    timelineEvents,
    currentMatchday,
  }
}
