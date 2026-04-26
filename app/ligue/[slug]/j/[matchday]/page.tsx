import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { getMatchdayEpisodePageData } from "@/lib/queries"
import {
  computeManagerOfWeekForMatchday,
  computeMatchOfRoundForMatchday,
  computeLeagueStoryKpis,
} from "@/lib/league-story-kpis"
import { buildAutomaticMatchdaySummary } from "@/lib/matchday-episode-summary"
import {
  getLoreForMatch,
  getScorelineLoreCaption,
  goldenRoostersWonAny,
} from "@/lib/league-lore"
import { LeagueStoryKpiCard, LeagueStoryKpiGrid } from "@/components/sections/LeagueStoryKpiGrid"
import StandingsEvolutionChart from "@/components/charts/StandingsEvolutionChart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle, ChevronLeft, ChevronRight, Info, Quote } from "lucide-react"
import type { ManagerWithTeam, StandingsHistoryWithManager } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Évite un HTML mis en cache (CDN / Next) qui masquerait les changements de mise en page. */
export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ slug: string; matchday: string }>
}

function labelManager(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

function labelTeamId(managers: ManagerWithTeam[], teamId: string): string {
  const m = managers.find((x) => x.team?.id === teamId)
  return m ? labelManager(m) : "Équipe"
}

function matchdayStatusLabel(status: string | null | undefined): string {
  if (status === "completed") return "Terminée"
  if (status === "in_progress") return "En cours"
  if (status) return status
  return "À venir"
}

function episodeNavTargets(
  numbers: number[],
  current: number
): { prevNum: number | null; nextNum: number | null } {
  const below = numbers.filter((n) => n < current)
  const above = numbers.filter((n) => n > current)
  return {
    prevNum: below.length > 0 ? below[below.length - 1]! : null,
    nextNum: above.length > 0 ? above[0]! : null,
  }
}

function MatchdayEpisodeNav({
  leagueSlug,
  prevNum,
  nextNum,
}: {
  leagueSlug: string
  prevNum: number | null
  nextNum: number | null
}) {
  const safeSlug = encodeURIComponent(leagueSlug)
  const btnClass =
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm font-medium tabular-nums shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-3"

  if (prevNum == null && nextNum == null) {
    return null
  }

  return (
    <nav aria-label="Journée précédente ou suivante" className="flex flex-wrap items-center gap-2">
      {prevNum != null ? (
        <Link href={`/ligue/${safeSlug}/j/${prevNum}`} className={btnClass}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span>J{prevNum}</span>
        </Link>
      ) : null}
      {nextNum != null ? (
        <Link href={`/ligue/${safeSlug}/j/${nextNum}`} className={btnClass}>
          <span>J{nextNum}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, matchday: matchdayParam } = await params
  const n = parseInt(matchdayParam, 10)
  if (!Number.isFinite(n) || n < 1) {
    return { title: "Journée" }
  }
  const data = await getMatchdayEpisodePageData(slug, n)
  if (!data) {
    return { title: "Journée introuvable" }
  }
  const title = data.matchday.title?.trim() || `Journée ${n}`
  return {
    title: `${title} — ${data.league.name}`,
    description: `Épisode J${n} : ${data.league.name}`,
  }
}

export default async function MatchdayEpisodePage({ params }: PageProps) {
  const { slug, matchday: matchdayParam } = await params
  const matchdayNumber = parseInt(matchdayParam, 10)
  if (!Number.isFinite(matchdayNumber) || matchdayNumber < 1) {
    notFound()
  }

  const data = await getMatchdayEpisodePageData(slug, matchdayNumber)
  if (!data) {
    notFound()
  }

  const {
    league,
    season,
    matchday,
    navMatchdayNumbers,
    managers,
    matchesForMatchday,
    validatedMatchRows,
    standingsHistory,
  } = data

  const { prevNum: episodePrevNum, nextNum: episodeNextNum } = episodeNavTargets(
    navMatchdayNumbers,
    matchdayNumber
  )

  const punchline =
    typeof matchday.punchline === "string" && matchday.punchline.trim() !== ""
      ? matchday.punchline.trim()
      : null

  const matchdayNumbers = [...new Set(standingsHistory.map((r) => r.matchday_number))].sort(
    (a, b) => a - b
  )
  const prevMatchdayNumber =
    matchdayNumbers.filter((d) => d < matchdayNumber).pop() ?? null
  const standingsBefore: StandingsHistoryWithManager[] =
    prevMatchdayNumber != null
      ? standingsHistory.filter((r) => r.matchday_number === prevMatchdayNumber)
      : []
  const standingsAfter = standingsHistory.filter((r) => r.matchday_number === matchdayNumber)

  const rowsForDay = validatedMatchRows.filter((r) => r.matchday_number === matchdayNumber)

  const ready = data.matchDataStatus === "ready"

  const managerOfWeek = ready
    ? computeManagerOfWeekForMatchday(managers, standingsHistory, matchdayNumber)
    : computeManagerOfWeekForMatchday(managers, [], matchdayNumber)

  const matchOfWeek = ready
    ? computeMatchOfRoundForMatchday(managers, validatedMatchRows, matchdayNumber)
    : computeMatchOfRoundForMatchday(managers, [], matchdayNumber)

  const storyKpis = ready
    ? computeLeagueStoryKpis(managers, standingsHistory, validatedMatchRows)
    : computeLeagueStoryKpis(managers, [], [])

  const summaryText = ready
    ? buildAutomaticMatchdaySummary({
        leagueName: league.name,
        matchdayNumber,
        managerOfWeek,
        matchOfWeek,
        standingsAfter,
        managers,
        validatedRowsForDay: rowsForDay,
      })
    : "Les données de résultats ne permettent pas encore de générer le récit automatique pour cette journée."

  const chartStandings = standingsHistory
    .filter((s) => s.matchday_number <= matchdayNumber)
    .map((s) => ({
      id: s.id,
      season_id: s.season_id,
      manager_id: s.manager_id,
      matchday_number: s.matchday_number,
      rank: s.rank,
      points: s.points ?? 0,
      goals_for: s.goals_for ?? 0,
      goals_against: s.goals_against ?? 0,
      form: s.form,
      created_at: s.created_at ?? "",
    }))

  const chartManagers = managers.map((m) => ({
    id: m.id,
    name: labelManager(m),
  }))

  const sortedAfter = [...standingsAfter].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return (b.points ?? 0) - (a.points ?? 0)
  })

  const loreScoreRows = matchesForMatchday
    .filter((m) => m.home_score != null && m.away_score != null)
    .map((m) => ({
      homeName: labelTeamId(managers, m.home_team_id),
      awayName: labelTeamId(managers, m.away_team_id),
      homeScore: m.home_score!,
      awayScore: m.away_score!,
    }))
  const mafiaTicker = goldenRoostersWonAny(loreScoreRows)
  const loreHooksForDay = [
    ...new Set(
      matchesForMatchday
        .map((m) =>
          getLoreForMatch(
            labelTeamId(managers, m.home_team_id),
            labelTeamId(managers, m.away_team_id)
          )
        )
        .filter((h): h is string => Boolean(h))
    ),
  ]

  const heroTitle = matchday.title?.trim() || `Journée ${matchdayNumber}`
  const heroSubtitle = `${league.name} · ${season.name} · ${matchdayStatusLabel(matchday.status)}`

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:max-w-5xl lg:px-8">
        <nav aria-label="Fil d’Ariane">
          <Link
            href={`/ligue/${encodeURIComponent(league.slug)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Retour au tableau de bord
          </Link>
        </nav>

        {data.matchDataStatus === "load_error" || data.matchDataStatus === "invalid" ? (
          <Alert variant={data.matchDataStatus === "load_error" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertTitle>
              {data.matchDataStatus === "load_error"
                ? "Impossible de charger les résultats"
                : "Données invalides"}
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {data.matchDataIssues.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {data.matchDataStatus === "empty" ? (
          <Alert>
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Aucun résultat pour cette saison</AlertTitle>
            <AlertDescription className="text-sm">
              Les blocs narratifs et le classement s’afficheront dès que des matchs seront saisis pour cette
              saison.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* 1. Hero : titre + sous-titre + résumé */}
        <header className="space-y-4 border-b border-border/60 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Épisode</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <h1 className="min-w-0 flex-1 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {heroTitle}
            </h1>
            <MatchdayEpisodeNav
              leagueSlug={league.slug}
              prevNum={episodePrevNum}
              nextNum={episodeNextNum}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{heroSubtitle}</p>
          {standingsBefore.length > 0 && standingsAfter.length > 0 ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              Classement comparé : après la J{prevMatchdayNumber} → après la J{matchdayNumber}.
            </p>
          ) : null}
          <p className="text-pretty border-t border-border/60 pt-4 text-sm leading-relaxed text-foreground sm:text-base">
            {summaryText}
          </p>
        </header>

        {/* 2. La synthèse (cartes stats : manager + match + chiffré) */}
        <section className="space-y-4" aria-labelledby="synthesis-heading">
          <h2 id="synthesis-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            La synthèse
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <LeagueStoryKpiCard kpi={managerOfWeek} />
            <LeagueStoryKpiCard kpi={matchOfWeek} />
            <Card className="border-border bg-card shadow-none sm:col-span-2 lg:col-span-1">
              <CardContent className="flex flex-col justify-center gap-1 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  J{matchdayNumber} en chiffres
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{rowsForDay.length}</p>
                <p className="text-xs text-muted-foreground">rencontre{rowsForDay.length > 1 ? "s" : ""}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {rowsForDay.reduce((s, r) => s + r.home_score + r.away_score, 0)}
                </p>
                <p className="text-xs text-muted-foreground">buts marqués</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Punchline */}
        {punchline ? (
          <section className="space-y-3" aria-labelledby="punchline-heading">
            <h2 id="punchline-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Punchline
            </h2>
            <Card className="border-primary/20 bg-primary/5 shadow-none">
              <CardContent className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                <Quote className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
                <p className="text-pretty text-sm font-medium leading-relaxed text-foreground sm:text-base">
                  {punchline}
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* 4. Le choc de la J… (scores du jour) */}
        <section className="space-y-3" aria-labelledby="choc-heading">
          <h2 id="choc-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Le choc de la J{matchdayNumber}
          </h2>
          {mafiaTicker ? (
            <div
              className="relative overflow-hidden rounded-md border border-amber-600/35 bg-amber-500/15 dark:bg-amber-950/40"
              role="status"
              aria-live="polite"
            >
              <div className="flex min-h-9 items-center justify-center gap-2 px-3 py-2 sm:px-4">
                <span className="shrink-0 rounded-sm bg-amber-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-amber-500 dark:text-amber-950">
                  Flash
                </span>
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100 sm:text-sm">
                  La Mafia Rolandèse valide — la dynastie a encore frappé sur cette journée.
                </p>
              </div>
            </div>
          ) : null}
          {matchesForMatchday.length > 0 ? (
            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tous les scores</CardTitle>
                <CardDescription>Résultats enregistrés pour cette journée.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {matchesForMatchday.map((m) => {
                  const homeLabel = labelTeamId(managers, m.home_team_id)
                  const awayLabel = labelTeamId(managers, m.away_team_id)
                  const hs = m.home_score
                  const awaySc = m.away_score
                  const caption =
                    hs != null && awaySc != null
                      ? getScorelineLoreCaption(homeLabel, awayLabel, hs, awaySc)
                      : null
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {homeLabel} — {awayLabel}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {m.home_score ?? "—"} – {m.away_score ?? "—"}
                        </span>
                      </div>
                      {caption ? (
                        <p className="mt-1.5 text-pretty text-xs italic leading-relaxed text-muted-foreground sm:text-sm">
                          {caption}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun score saisi pour cette journée.</p>
          )}

          {matchesForMatchday.length > 0 ? (
            <section className="space-y-2" aria-labelledby="lore-context-heading">
              <h3
                id="lore-context-heading"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Contexte historique
              </h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Neuf saisons de hauts et de bas : certaines affiches réveillent des histoires plus vieilles que le
                classement du moment.
              </p>
              {loreHooksForDay.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
                  {loreHooksForDay.map((hook, i) => (
                    <li key={i} className="text-pretty italic text-muted-foreground">
                      {hook}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Aucune rivalité « scriptée » pour ces duels — le lore garde le silence, pour l’instant.
                </p>
              )}
            </section>
          ) : null}
        </section>

        {/* 5. Les grands récits */}
        <LeagueStoryKpiGrid
          kpis={storyKpis}
          sectionTitle="Les grands récits"
          sectionDescription="Indicateurs narratifs calculés sur la saison à partir de cette journée."
          compact
        />

        {/* 6. La bataille pour le titre */}
        <section className="space-y-3" aria-labelledby="chart-heading">
          <h2 id="chart-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            La bataille pour le titre
          </h2>
          <p className="text-sm text-muted-foreground">
            Jusqu’à la J{matchdayNumber} incluse — comparez jusqu’à 4 managers.
          </p>
          <StandingsEvolutionChart standings={chartStandings} managers={chartManagers} leagueId={league.id} />
        </section>

        {/* 7. Classement */}
        <section className="space-y-3 pb-8" aria-labelledby="table-heading">
          <h2 id="table-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Classement
          </h2>
          <p className="text-sm text-muted-foreground">Après la J{matchdayNumber}.</p>
          {sortedAfter.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas encore de ligne de classement pour cette journée (résultats manquants ou en cours de
              validation).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">BP</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">BC</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Forme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAfter.map((row) => {
                  const mgr = managers.find((m) => m.id === row.manager_id)
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-semibold tabular-nums">{row.rank}</TableCell>
                      <TableCell className="font-medium">{mgr ? labelManager(mgr) : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.points ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {row.goals_for ?? 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell">
                        {row.goals_against ?? 0}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-xs text-muted-foreground hidden md:table-cell tracking-wider"
                        )}
                      >
                        {row.form ?? "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </section>

        {(episodePrevNum != null || episodeNextNum != null) && (
          <footer className="border-t border-border/60 pt-8 pb-4">
            <MatchdayEpisodeNav
              leagueSlug={league.slug}
              prevNum={episodePrevNum}
              nextNum={episodeNextNum}
            />
          </footer>
        )}
      </div>
    </div>
  )
}
