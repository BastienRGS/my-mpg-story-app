import { createClient } from '@/lib/supabase/server'
import type {
  League,
  Season,
  Article,
  TimelineEvent,
  Matchday,
  Match,
  DashboardData,
  ManagerWithTeam,
  StandingsHistoryWithManager,
  MatchResult,
  DashboardMatchDataStatus,
  ValidatedMatchRow,
  ManagerCard,
} from '@/lib/types'
import { computeStandingsHistoryFromMatches, maxMatchdayFromMatches } from '@/lib/compute-standings-from-matches'
import { validateSeasonMatchResults } from '@/lib/match-results-validation'
import {
  getLoreForCoach,
  getPalmarèsCountsForTeam,
  resolveSeason10RosterTeamDivision,
  resolveTeamKey,
} from '@/lib/league-lore'
import type { BonusHighlightBlock } from '@/lib/types'
import {
  computeMatchdayBonusHighlight,
  type MatchBonusRecord,
} from '@/lib/matchday-narrative'

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

const SEASON_SELECT = 'id, name, is_current, league_id, total_matchdays'

export function getTotalMatchdaysFromSeason(season: Season | null): number {
  return season?.total_matchdays ?? 12
}

export async function getCurrentSeason(leagueId: string): Promise<Season | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seasons')
    .select(SEASON_SELECT)
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
    .select(SEASON_SELECT)
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

type PalmarèsCounts = ManagerCard['palmares']

/**
 * Phrase d’accroche (1 ligne) pour la carte manager — règles éditoriales JAKATTAK.
 * Générée ici pour garder `getManagersWithStats` autonome côté narratif.
 */
function buildManagerLoreDescription(teamName: string, palmares: PalmarèsCounts): string {
  const key = resolveTeamKey(teamName)
  if (key === 'golden_roosters') {
    return '5 titres, une domination sans partage. La Mafia Rolandèse plane sur chaque journée.'
  }
  if (key === 'jakattak') {
    return 'Fondateur de la ligue, exilé en L2 en S7, de retour pour récupérer son trône.'
  }
  if (key === 'bab_olympique') {
    return "Premier champion de l'histoire, le fantôme du passé cherche son retour en L1."
  }
  if (key === 'madeinviet') {
    return 'Champion en S8, relégué en S9. Le champion déchu veut sa revanche.'
  }
  if (key === 'deepblue') {
    return "Yo-yo perpétuel entre L1 et L2. La régularité n'est pas son fort."
  }
  if (palmares.l1Titles >= 2) {
    return `${palmares.l1Titles} titres L1 au compteur : une domination qui pèse sur toute la ligue.`
  }
  if (palmares.relegations >= 2) {
    return `${palmares.relegations} relégations en L1 : une trajectoire faite de hauts et de bas.`
  }
  return `${teamName} construit sa légende, journée après journée.`
}

/**
 * Managers de la ligue avec stats **de la dernière journée déjà jouée** (dérivées des matchs
 * validés, comme le dashboard — cohérent avec `computeStandingsHistoryFromMatches`).
 */
export async function getManagersWithStats(
  seasonId: string,
  leagueId: string
): Promise<ManagerCard[]> {
  const managers = await getManagers(leagueId, seasonId)
  const bundle = await getMatchResults(seasonId)
  const { rows: matchResults, error: loadError } = bundle

  const lastByManager = new Map<string, StandingsHistoryWithManager>()

  if (!loadError && matchResults.length > 0) {
    const { issues, validRows } = validateSeasonMatchResults(managers, matchResults)
    if (issues.length === 0 && validRows.length > 0) {
      const standings = computeStandingsHistoryFromMatches(seasonId, managers, validRows)
      const lastMd = maxMatchdayFromMatches(validRows)
      if (lastMd > 0) {
        for (const r of standings) {
          if (r.matchday_number === lastMd) {
            lastByManager.set(r.manager_id, r)
          }
        }
      }
    }
  }

  return managers.map((m) => {
    const coachName = m.name
    const teamName = (m.identity_label ?? '').trim()
    const loreTeamName =
      teamName.length > 0 ? teamName : (m.team?.name ?? '').trim()
    const row = lastByManager.get(m.id)
    const palmares = getPalmarèsCountsForTeam(loreTeamName)
    const { league: currentLeague, matchedRoster } = resolveSeason10RosterTeamDivision(loreTeamName)
    if (!matchedRoster) {
      console.warn(
        `[Managers] Aucune entrée roster Saison 10 pour l’équipe « ${loreTeamName} » — L1/L2 peut être incorrect.`
      )
    }
    return {
      id: m.id,
      name: m.name,
      coachName,
      teamName,
      currentLeague,
      rank: row?.rank ?? null,
      points: row?.points ?? null,
      goalsFor: row?.goals_for ?? null,
      goalsAgainst: row?.goals_against ?? null,
      matchesPlayed: row?.matches_played ?? null,
      form: row?.form ?? null,
      winStreak: row?.win_streak ?? 0,
      loseStreak: row?.lose_streak ?? 0,
      loreTag: getLoreForCoach(loreTeamName),
      loreDescription: buildManagerLoreDescription(loreTeamName, palmares),
      palmares,
    }
  })
}

/** Slugs Supabase des deux divisions JAKATTAK (page `/managers` multiligue). */
const ALL_MANAGERS_LEAGUE_SLUGS = ['jakattak_ligue1', 'jakattak_ligue2'] as const

/**
 * Tous les managers L1 + L2 : stats par ligue (saison courante de chaque slug),
 * `currentLeague` issu de `resolveSeason10RosterTeamDivision` / `CURRENT_SEASON_10_ROSTERS` (`league-lore`).
 * Tri : L1 d’abord par rang, puis L2 par rang ; rangs absents en dernier dans chaque groupe.
 */
export async function getAllManagersWithStats(): Promise<ManagerCard[]> {
  const chunks = await Promise.all(
    ALL_MANAGERS_LEAGUE_SLUGS.map(async (slug) => {
      const league = await getLeagueBySlug(slug)
      if (!league) return [] as ManagerCard[]
      const season = await getCurrentSeason(league.id)
      if (!season) return [] as ManagerCard[]
      return getManagersWithStats(season.id, league.id)
    })
  )

  const merged = chunks.flat()
  merged.sort((a, b) => {
    if (a.currentLeague !== b.currentLeague) {
      return a.currentLeague === 'L1' ? -1 : 1
    }
    const ra = a.rank
    const rb = b.rank
    if (ra === null && rb === null) return 0
    if (ra === null) return 1
    if (rb === null) return -1
    return ra - rb
  })

  return merged
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

/** Bonus MPG liés à des matchs (lecture anon via RLS). */
export async function getMatchBonusesForMatchIds(matchIds: string[]): Promise<MatchBonusRecord[]> {
  if (matchIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('match_bonuses')
    .select('match_id, manager_id, bonus_type, bonus_outcome, created_at, highlight')
    .in('match_id', matchIds)

  if (error) {
    console.error('Error fetching match_bonuses:', error)
    return []
  }

  return (data ?? []) as MatchBonusRecord[]
}

/** Bonus mis en avant pour la synthèse (`highlight = true`). */
export async function getHighlightedMatchBonusesForMatchIds(matchIds: string[]): Promise<MatchBonusRecord[]> {
  if (matchIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('match_bonuses')
    .select('match_id, manager_id, bonus_type, bonus_outcome, created_at, highlight')
    .in('match_id', matchIds)
    .eq('highlight', true)

  if (error) {
    console.error('Error fetching highlighted match_bonuses:', error)
    return []
  }

  return (data ?? []) as MatchBonusRecord[]
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

export async function getMatchdayBySeasonAndNumber(
  seasonId: string,
  number: number
): Promise<Matchday | null> {
  if (!Number.isFinite(number) || number < 1) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matchdays')
    .select('*')
    .eq('season_id', seasonId)
    .eq('number', number)
    .maybeSingle()

  if (error) {
    console.error('Error fetching matchday by season and number:', error)
    return null
  }

  return data as Matchday | null
}

/** Journée avec matchs embarqués (requête unique `matchdays` + `matches`). */
export type MatchdayWithMatches = Matchday & { matches: Match[] }

/** PostgREST peut renvoyer un seul enfant comme objet au lieu d’un tableau. */
function normalizeEmbeddedMatches(raw: unknown): Match[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw as Match[]
  if (typeof raw === 'object') return [raw as Match]
  return []
}

/**
 * Toutes les journées d’une saison avec leurs matchs.
 * Essaie d’abord un embed `matchdays → matches` via la FK **`matches.matchday_id`** (comme `getMatchResults`).
 * Si l’embed échoue (relation non exposée, autre nom de contrainte, etc.), repli sur le même schéma que
 * `getMatchResults` : `matchdays` puis `matches` avec `.in('matchday_id', …)`.
 */
export async function getMatchdaysWithMatchesForSeason(
  seasonId: string
): Promise<{ matchdays: MatchdayWithMatches[]; error: string | null }> {
  const supabase = await createClient()

  const matchColumns =
    'id, matchday_id, home_team_id, away_team_id, home_score, away_score, created_at'

  const embedded = await supabase
    .from('matchdays')
    .select(`*, matches ( ${matchColumns} )`)
    .eq('season_id', seasonId)
    .order('number', { ascending: false })

  if (!embedded.error && embedded.data) {
    const matchdays: MatchdayWithMatches[] = embedded.data.map((row) => {
      const raw = row as Matchday & { matches?: unknown }
      const { matches: embeddedRaw, ...md } = raw
      return {
        ...(md as Matchday),
        matches: normalizeEmbeddedMatches(embeddedRaw),
      }
    })
    return { matchdays, error: null }
  }

  if (embedded.error) {
    console.warn(
      'matchdays+matches embed indisponible, repli sur requêtes séparées (matchday_id) :',
      embedded.error.message
    )
  }

  const { data: mdsRaw, error: mdErr } = await supabase
    .from('matchdays')
    .select('*')
    .eq('season_id', seasonId)
    .order('number', { ascending: false })

  if (mdErr) {
    console.error('Error fetching matchdays (historique fallback):', mdErr)
    return {
      matchdays: [],
      error: embedded.error?.message ?? mdErr.message,
    }
  }

  const mds = (mdsRaw ?? []) as Matchday[]
  const matchdayIds = mds.map((m) => m.id)
  if (matchdayIds.length === 0) {
    return { matchdays: [], error: null }
  }

  const { data: matchesRaw, error: mErr } = await supabase
    .from('matches')
    .select(matchColumns)
    .in('matchday_id', matchdayIds)

  if (mErr) {
    console.error('Error fetching matches (historique fallback):', mErr)
    return { matchdays: [], error: mErr.message }
  }

  const byMd = new Map<string, Match[]>()
  for (const row of matchesRaw ?? []) {
    const m = row as Match
    const id = m.matchday_id
    if (!byMd.has(id)) byMd.set(id, [])
    byMd.get(id)!.push(m)
  }

  const matchdays: MatchdayWithMatches[] = mds.map((md) => ({
    ...md,
    matches: byMd.get(md.id) ?? [],
  }))

  return { matchdays, error: null }
}

/**
 * Punchline éditoriale (table `punchlines` : `season_id`, `matchday_number`, `text`).
 */
export async function getPunchlineForSeasonMatchday(
  seasonId: string,
  matchdayNumber: number
): Promise<string | null> {
  const sid = seasonId?.trim()
  if (!sid || !Number.isFinite(matchdayNumber) || matchdayNumber < 1) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('punchlines')
    .select('text')
    .eq('season_id', sid)
    .eq('matchday_number', matchdayNumber)
    .limit(1)
    .maybeSingle()

  if (error) {
    return null
  }

  const row = data as { text?: string } | null
  const t = row?.text
  return typeof t === 'string' && t.trim() !== '' ? t.trim() : null
}

export async function getMatchesForMatchday(matchdayId: string): Promise<Match[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('matchday_id', matchdayId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching matches for matchday:', error)
    return []
  }

  return (data ?? []).map((m) => ({
    id: m.id,
    matchday_id: m.matchday_id,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    home_score: m.home_score != null ? Number(m.home_score) : null,
    away_score: m.away_score != null ? Number(m.away_score) : null,
    summary: m.summary ?? null,
    hero_name: m.hero_name ?? null,
    flop_name: m.flop_name ?? null,
    created_at: m.created_at ?? null,
  })) as Match[]
}

export type MatchdayEpisodePageData = {
  league: League
  season: Season
  matchday: Matchday
  /** Numéros de journée présents dans `matchdays` pour cette saison (triés), pour la navigation épisode. */
  navMatchdayNumbers: number[]
  managers: ManagerWithTeam[]
  matchesForMatchday: Match[]
  validatedMatchRows: ValidatedMatchRow[]
  standingsHistory: StandingsHistoryWithManager[]
  matchDataStatus: DashboardMatchDataStatus
  matchDataIssues: string[]
  matchesLoadError: string | null
  bonusHighlight: BonusHighlightBlock | null
}

/**
 * Données pour la page épisode `/ligue/[slug]/j/[matchday]`.
 * Retourne `null` si la ligue, la saison courante ou la journée (numéro dans la saison) n’existe pas.
 */
export async function getMatchdayEpisodePageData(
  leagueSlug: string,
  matchdayNumber: number
): Promise<MatchdayEpisodePageData | null> {
  const league = await getLeagueBySlug(leagueSlug)
  if (!league) return null

  const season = await getCurrentSeason(league.id)
  if (!season) return null

  const matchday = await getMatchdayBySeasonAndNumber(season.id, matchdayNumber)
  if (!matchday) return null

  const [managers, matchBundle, matchesForMatchday, seasonMatchdays] = await Promise.all([
    getManagers(league.id, season.id),
    getMatchResults(season.id),
    getMatchesForMatchday(matchday.id),
    getMatchdays(season.id),
  ])

  const navMatchdayNumbers = [...new Set(seasonMatchdays.map((m) => m.number))]
    .filter((n) => Number.isFinite(n) && n >= 1)
    .sort((a, b) => a - b)

  const { rows: matchResults, error: matchesLoadError } = matchBundle

  let matchDataStatus: DashboardMatchDataStatus = 'empty'
  let matchDataIssues: string[] = []
  let validatedMatchRows: ValidatedMatchRow[] = []
  let standingsHistory: StandingsHistoryWithManager[] = []

  if (matchesLoadError) {
    matchDataStatus = 'load_error'
    matchDataIssues = [
      `Impossible de charger les résultats (tables « matchdays » / « matches »). Détail : ${matchesLoadError}`,
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
    }
  }

  const bonusRows = await getHighlightedMatchBonusesForMatchIds(matchesForMatchday.map((m) => m.id))
  const bonusHighlight = computeMatchdayBonusHighlight(bonusRows, managers)

  return {
    league,
    season,
    matchday,
    navMatchdayNumbers,
    managers,
    matchesForMatchday,
    validatedMatchRows,
    standingsHistory,
    matchDataStatus,
    matchDataIssues,
    matchesLoadError,
    bonusHighlight,
  }
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
    matchdayPunchlineFromTable: null,
    bonusHighlight: null,
    totalMatchdays: 12,
    matchdayHighlightedBonuses: [],
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
  let matchdayPunchlineFromTable: string | null = null
  let bonusHighlight: BonusHighlightBlock | null = null
  let matchdayHighlightedBonuses: Awaited<ReturnType<typeof getHighlightedMatchBonusesForMatchIds>> = []

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
        const dbMd = await getMatchdayBySeasonAndNumber(season.id, n)
        currentMatchday =
          dbMd ??
          ({
            id: `derived-md-${season.id}`,
            season_id: season.id,
            number: n,
            title: null,
            status: 'completed',
            created_at: null,
          } as Matchday)
      }
    }
  }

  if (season && currentMatchday && currentMatchday.number >= 1) {
    matchdayPunchlineFromTable = await getPunchlineForSeasonMatchday(season.id, currentMatchday.number)
    const mdNum = currentMatchday.number
    const idsThisMd = matchResults.filter((r) => r.matchday_number === mdNum).map((r) => r.id)
    const bonusRows = await getHighlightedMatchBonusesForMatchIds(idsThisMd)
    matchdayHighlightedBonuses = bonusRows
    bonusHighlight = computeMatchdayBonusHighlight(bonusRows, managers)
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
    matchdayPunchlineFromTable,
    bonusHighlight,
    totalMatchdays: getTotalMatchdaysFromSeason(season),
    matchdayHighlightedBonuses,
  }
}
