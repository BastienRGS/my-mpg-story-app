import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import {
  getLeagueBySlug,
  getManagers,
  getMatchdaysWithMatchesForSeason,
  getSeasonsForLeague,
  type MatchdayWithMatches,
} from "@/lib/queries"
import { validateSeasonMatchResults } from "@/lib/match-results-validation"
import { computeStandingsHistoryFromMatches } from "@/lib/compute-standings-from-matches"
import type { ManagerWithTeam, Match, MatchResult, Season } from "@/lib/types"
import { MatchdayHistoryCard, type MatchdayHistoryCardProps } from "@/components/ligue/MatchdayHistoryCard"

type PageProps = {
  params: Promise<{ slug: string }>
}

type MatchdayWithOptionalDate = MatchdayWithMatches & {
  match_date?: string | null
  played_at?: string | null
}

function labelManager(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

function labelTeamId(managers: ManagerWithTeam[], teamId: string): string {
  const m = managers.find((x) => x.team?.id === teamId)
  return m ? labelManager(m) : "Équipe"
}

function formatMatchdayDate(md: MatchdayWithOptionalDate): string | null {
  const iso = md.match_date || md.played_at || md.created_at
  if (!iso || typeof iso !== "string") return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d)
}

function seasonArchiveLabel(season: Season): string {
  const name = season.name.trim()
  if (name === "2026") return "Saison 2025-2026 PART 2"
  if (name.length > 0) return name.startsWith("Saison ") ? name : `Saison ${name}`
  return "Saison archivée"
}

function matchResultsFromMatchdays(matchdays: MatchdayWithMatches[]): MatchResult[] {
  const out: MatchResult[] = []
  for (const md of matchdays) {
    const n = md.number
    for (const m of md.matches) {
      out.push({
        id: m.id,
        matchday_id: m.matchday_id,
        matchday_number: n,
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_score: m.home_score != null ? Number(m.home_score) : null,
        away_score: m.away_score != null ? Number(m.away_score) : null,
        created_at: m.created_at ?? null,
      } as MatchResult)
    }
  }
  return out
}

function pickBestMatchLabel(matches: Match[], labelTeam: (id: string) => string): string | null {
  let best: { total: number; m: Match } | null = null
  for (const m of matches) {
    if (m.home_score == null || m.away_score == null) continue
    const h = Number(m.home_score)
    const a = Number(m.away_score)
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) continue
    const total = h + a
    if (!best || total > best.total) {
      best = { total, m }
    }
  }
  if (!best) return null
  const { m } = best
  return `${labelTeam(m.home_team_id)} ${m.home_score} – ${m.away_score} ${labelTeam(m.away_team_id)}`
}

function buildCardProps(
  md: MatchdayWithMatches,
  managers: ManagerWithTeam[],
  leagueSlug: string,
  seasonId: string,
  standingsByMatchday: Map<number, MatchdayHistoryCardProps["standingsRows"]>,
  standingsAvailable: boolean,
  standingsUnavailableReason: string | null
): MatchdayHistoryCardProps {
  const labelTeam = (id: string) => labelTeamId(managers, id)
  const matches = md.matches ?? []

  return {
    leagueSlug,
    seasonId,
    matchdayNumber: md.number,
    displayTitle: `Journée ${md.number}`,
    dateLabel: formatMatchdayDate(md as MatchdayWithOptionalDate),
    bestMatchLabel: pickBestMatchLabel(matches, labelTeam),
    modalMatches: matches.map((m) => ({
      homeLabel: labelTeam(m.home_team_id),
      awayLabel: labelTeam(m.away_team_id),
      homeScore: m.home_score != null ? Number(m.home_score) : null,
      awayScore: m.away_score != null ? Number(m.away_score) : null,
    })),
    standingsRows: standingsByMatchday.get(md.number) ?? [],
    standingsAvailable,
    standingsUnavailableReason,
  }
}

async function buildSeasonHistorySection(leagueSlug: string, season: Season) {
  const [managers, bundle] = await Promise.all([
    getManagers(season.league_id, season.id),
    getMatchdaysWithMatchesForSeason(season.id),
  ])

  const { matchdays, error: bundleError } = bundle

  const matchResults = matchResultsFromMatchdays(matchdays)
  const { issues, validRows } = validateSeasonMatchResults(managers, matchResults)
  const standingsAvailable = issues.length === 0 && validRows.length > 0
  const standingsHistory = standingsAvailable
    ? computeStandingsHistoryFromMatches(season.id, managers, validRows)
    : []

  const standingsUnavailableReason =
    issues.length > 0
      ? "Le classement ne peut pas être calculé : données de matchs invalides ou incomplètes."
      : validRows.length === 0 && matchResults.length > 0
        ? "Le classement ne peut pas être calculé tant que les scores ne sont pas tous valides."
        : validRows.length === 0
          ? "Aucun résultat saisi pour cette saison — pas de classement à afficher."
          : null

  const standingsByMatchday = new Map<number, MatchdayHistoryCardProps["standingsRows"]>()
  if (standingsAvailable) {
    for (const md of matchdays) {
      const n = md.number
      const rows = standingsHistory
        .filter((r) => r.matchday_number === n)
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank
          return (b.points ?? 0) - (a.points ?? 0)
        })
        .map((r) => ({
          rank: r.rank,
          teamLabel: r.manager ? labelManager(r.manager as ManagerWithTeam) : "—",
          points: r.points ?? 0,
          goalsFor: r.goals_for ?? 0,
          goalsAgainst: r.goals_against ?? 0,
        }))
      standingsByMatchday.set(n, rows)
    }
  }

  return {
    season,
    bundleError,
    cards: matchdays.map((md) =>
      buildCardProps(
        md,
        managers,
        leagueSlug,
        season.id,
        standingsByMatchday,
        standingsAvailable,
        standingsUnavailableReason
      )
    ),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) {
    return { title: "Historique" }
  }
  return {
    title: `Historique des journées — ${league.name}`,
    description: `Toutes les journées de ${league.name}, du plus récent au plus ancien.`,
  }
}

export default async function LeagueHistoryPage({ params }: PageProps) {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) {
    notFound()
  }

  const seasons = await getSeasonsForLeague(league.id)
  if (seasons.length === 0) {
    notFound()
  }

  const currentSeason = seasons.find((s) => s.is_current === true) ?? seasons[0]!
  const sections = await Promise.all(seasons.map((season) => buildSeasonHistorySection(league.slug, season)))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:max-w-3xl">
        <nav aria-label="Fil d’Ariane">
          <Link
            href={`/ligue/${encodeURIComponent(league.slug)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Retour au tableau de bord
          </Link>
        </nav>

        <header className="space-y-2 border-b border-border/60 pb-6">
          <p className="section-label">La Gazzattak</p>
          <h1 className="text-balance text-2xl tracking-tight text-foreground sm:text-3xl">
            Historique des journées
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {league.name} · saison courante : {seasonArchiveLabel(currentSeason)}
          </p>
        </header>

        {sections.every((section) => section.cards.length === 0 && !section.bundleError) ? (
          <p className="text-sm text-muted-foreground">
            Aucune journée enregistrée dans Supabase.
          </p>
        ) : (
          <div className="space-y-8">
            {sections.map(({ season, bundleError, cards }) => (
              <section key={season.id} className="space-y-3" aria-labelledby={`season-${season.id}`}>
                <div className="border-b border-border/50 pb-2">
                  <p className="section-label">
                    {season.is_current ? "Saison en cours" : "Archive"}
                  </p>
                  <h2 id={`season-${season.id}`} className="text-xl font-semibold tracking-tight text-foreground">
                    {seasonArchiveLabel(season)}
                  </h2>
                </div>

                {bundleError ? (
                  <p className="text-sm text-destructive" role="alert">
                    Impossible de charger les journées : {bundleError}
                  </p>
                ) : cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune journée enregistrée pour cette saison.
                  </p>
                ) : (
                  <ul className="space-y-3" aria-label={`Liste des journées - ${seasonArchiveLabel(season)}`}>
                    {cards.map((c) => (
                      <li key={`${season.id}-${c.matchdayNumber}`}>
                        <MatchdayHistoryCard {...c} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
