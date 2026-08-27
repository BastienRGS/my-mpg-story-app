import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import type { CSSProperties, ReactNode } from "react"
import { headers } from "next/headers"
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
import {
  buildMastheadHeadline,
  buildMastheadSubheadKicker,
  seasonHeaderLabelFromSeasonName,
} from "@/lib/matchday-newspaper"
import StandingsEvolutionChart from "@/components/charts/StandingsEvolutionChart"
import { createClient } from "@/lib/supabase/server"
import { ShareButton } from "@/components/matchday/ShareButton"
import { MatchdayNarrativeBonusSection } from "@/components/sections/MatchdayNarrative"
import { AlertCircle, Info } from "lucide-react"
import type { LeagueStoryKpi } from "@/lib/league-story-kpis"
import type { ManagerWithTeam, StandingsHistoryWithManager } from "@/lib/types"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const NEWSPAPER_VARS: CSSProperties = {
  ["--color-bg" as string]: "#0a0a0a",
  ["--color-surface" as string]: "#141414",
  ["--color-accent" as string]: "#3ddc84",
  ["--color-alert" as string]: "#E8000D",
  ["--color-text" as string]: "#ffffff",
  ["--color-muted" as string]: "#888888",
} as const

type PageProps = {
  params: Promise<{ slug: string; matchday: string }>
  searchParams?: Promise<{ season?: string }>
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

function SectionKicker({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="section-label border-l-4 pl-3 font-extrabold"
      style={{ borderColor: "#3ddc84" }}
    >
      {children}
    </h2>
  )
}

function MatchdayKpiBlock({ kpi }: { kpi: LeagueStoryKpi }) {
  const isMotw = kpi.slug === "match_of_round"
  const mainLine = isMotw ? kpi.managerName : kpi.teamLabel || kpi.managerName
  const subLine = isMotw
    ? kpi.teamLabel
    : kpi.teamLabel && kpi.managerName && kpi.managerName !== kpi.teamLabel
      ? kpi.managerName
      : null
  return (
    <article
      className="flex min-h-0 flex-col border border-white/5 bg-[#141414] pl-[3px]"
      style={{ borderLeft: "3px solid #3ddc84" }}
    >
      <div className="p-4 sm:p-5">
        <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#888]">{kpi.title}</p>
        <p
          className="mt-2 min-w-0 break-words text-2xl font-black uppercase leading-tight text-white"
          style={{ fontSize: "1.5rem" }}
        >
          {mainLine}
        </p>
        {subLine ? (
        <p className="mt-1 min-w-0 break-words text-sm font-medium text-zinc-400">
          {subLine}
        </p>
        ) : null}
        {kpi.hasData ? (
          <p className="mt-3 text-[0.85rem] leading-[1.5] text-zinc-300">
            {kpi.detail}
          </p>
        ) : (
          <p className="mt-3 text-[0.85rem] leading-[1.5] text-zinc-500">Pas encore assez de données.</p>
        )}
        {kpi.loreSubtitle ? (
          <p className="mt-2 text-xs italic text-[#3ddc84] sm:text-sm">{kpi.loreSubtitle}</p>
        ) : null}
      </div>
    </article>
  )
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug, matchday: matchdayParam } = await params
  const search = searchParams ? await searchParams : {}
  const seasonId = typeof search.season === "string" && search.season.trim() !== ""
    ? search.season.trim()
    : null
  const n = parseInt(matchdayParam, 10)
  if (!Number.isFinite(n) || n < 1) {
    return { title: "Journée" }
  }
  const data = await getMatchdayEpisodePageData(slug, n, { seasonId })
  if (!data) {
    return { title: "Journée introuvable" }
  }
  const title = data.matchday.title?.trim() || `Journée ${n}`
  return {
    title: `${title} — ${data.league.name}`,
    description: `Épisode J${n} : ${data.league.name}`,
  }
}

export default async function MatchdayEpisodePage({ params, searchParams }: PageProps) {
  const { slug, matchday: matchdayParam } = await params
  const search = searchParams ? await searchParams : {}
  const seasonId = typeof search.season === "string" && search.season.trim() !== ""
    ? search.season.trim()
    : null
  const matchdayNumber = parseInt(matchdayParam, 10)
  if (!Number.isFinite(matchdayNumber) || matchdayNumber < 1) {
    notFound()
  }

  const data = await getMatchdayEpisodePageData(slug, matchdayNumber, { seasonId })
  if (!data) {
    notFound()
  }

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  const siteBase = host ? `${proto}://${host}` : ""
  const seasonQuery = seasonId ? `?season=${encodeURIComponent(seasonId)}` : ""
  const shareUrl = `${siteBase}/ligue/${encodeURIComponent(slug)}/j/${matchdayNumber}${seasonQuery}`

  const {
    league,
    season,
    matchday,
    navMatchdayNumbers,
    managers,
    matchesForMatchday,
    validatedMatchRows,
    standingsHistory,
    bonusHighlight,
  } = data

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userEmail = auth.user?.email
  const highlightManagerId: string | null = userEmail
    ? (managers.find(
        (m) => m.identity_label && m.identity_label.toLowerCase() === userEmail.toLowerCase()
      )?.id ?? null)
    : null

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

  const nTeams = sortedAfter.length
  const rowTextClass = (rank: number) => {
    if (nTeams <= 1) return "text-[#3ddc84]"
    if (rank <= 2) return "text-[#3ddc84]"
    if (rank > nTeams - 2) return "text-[#E8000D]"
    return "text-zinc-100"
  }

  const loreScoreRows = matchesForMatchday
    .filter((m) => m.home_score != null && m.away_score != null)
    .map((m) => ({
      homeName: labelTeamId(managers, m.home_team_id),
      awayName: labelTeamId(managers, m.away_team_id),
      homeScore: m.home_score!,
      awayScore: m.away_score!,
    }))
  const mafiaTicker = goldenRoostersWonAny(loreScoreRows)

  const perMatchLore = matchesForMatchday
    .map((m) => {
      const homeL = labelTeamId(managers, m.home_team_id)
      const awayL = labelTeamId(managers, m.away_team_id)
      const h = getLoreForMatch(homeL, awayL)
      return h ? { id: m.id, hook: h, home: homeL, away: awayL } : null
    })
    .filter((x): x is { id: string; hook: string; home: string; away: string } => x !== null)

  const heroTitle = matchday.title?.trim() || `Journée ${matchdayNumber}`
  const kicker = buildMastheadSubheadKicker({ managerOfWeek, matchOfWeek, storyKpis })
  const mainHead = buildMastheadHeadline(punchline, summaryText, ready, heroTitle)
  const seasonRow = seasonHeaderLabelFromSeasonName(season.name, matchdayNumber)

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white antialiased"
      style={NEWSPAPER_VARS}
    >
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-5 sm:py-6">
        <nav
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Accès ligue"
        >
          <Link
            href={`/ligue/${encodeURIComponent(league.slug)}`}
            className="inline-flex min-h-12 w-fit items-center text-xs font-mono font-medium uppercase tracking-widest text-[#888] underline-offset-2 hover:underline"
          >
            ← Tableau
          </Link>
          <Link
            href="/admin/match-results"
            className="inline-flex min-h-10 w-fit max-w-full items-center justify-center border border-[#3ddc84]/30 px-3 py-2 text-[0.6rem] font-mono font-semibold uppercase tracking-widest text-[#3ddc84] transition hover:bg-[#3ddc84]/10"
          >
            Saisie admin / punchline
          </Link>
        </nav>

        {data.matchDataStatus === "load_error" || data.matchDataStatus === "invalid" ? (
          <div className="mb-8 space-y-2 border border-red-600/30 bg-red-950/20 p-4 text-sm text-zinc-100">
            <p className="flex items-center gap-2 font-extrabold uppercase tracking-wide text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {data.matchDataStatus === "load_error" ? "Impossible de charger" : "Données invalides"}
            </p>
            <ul className="list-inside list-disc space-y-1 text-zinc-300">
              {data.matchDataIssues.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {data.matchDataStatus === "empty" ? (
          <div className="mb-8 space-y-2 border border-amber-500/30 bg-amber-950/10 p-4 text-sm text-zinc-200">
            <p className="font-bold text-amber-400">Aucun résultat pour cette saison</p>
            <p className="flex items-start gap-2 text-zinc-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Saisissez des matchs pour alimenter la une.
            </p>
          </div>
        ) : null}

        {/* 1. Masthead */}
        <header className="space-y-0 pb-8">
          <div className="flex min-h-6 flex-col justify-between gap-1 font-mono text-[0.65rem] font-semibold uppercase leading-tight tracking-[0.2em] text-[#666] sm:flex-row sm:items-baseline sm:gap-2">
            <span className="break-words text-[#888]">LA GAZZATTAK</span>
            <span className="shrink-0 self-end sm:self-auto">{seasonRow}</span>
          </div>
          <div
            className="mt-3 w-full"
            style={{ height: 1, background: "#3ddc84" }}
            aria-hidden
          />
          {standingsBefore.length > 0 && standingsAfter.length > 0 ? (
            <p className="mt-3 text-[0.6rem] font-mono text-[#666]">
              Classt. : J{prevMatchdayNumber} → J{matchdayNumber} · {matchdayStatusLabel(matchday.status)}
            </p>
          ) : null}

          <h1
            className="font-display mt-4 w-full min-w-0 break-words uppercase leading-[0.95] text-[#3ddc84]"
            style={{ fontSize: "clamp(2rem, 8vw, 5rem)" }}
          >
            {mainHead.toLocaleUpperCase("fr-FR")}
          </h1>
          {ready && rowsForDay.length > 0 ? (
            <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-zinc-500">
              J{matchdayNumber} : {rowsForDay.length} rencontre{rowsForDay.length > 1 ? "s" : ""} ·{" "}
              {rowsForDay.reduce((s, r) => s + r.home_score + r.away_score, 0)} buts
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-tight text-zinc-200 sm:text-base">
            {kicker.toLocaleUpperCase("fr-FR")}
          </p>
        </header>

        {data.matchDataStatus === "ready" && matchesForMatchday.length > 0 ? (
          <>
            {mafiaTicker ? (
              <div
                className="mb-5 flex min-h-12 w-full items-center justify-center border border-[#E8000D]/30 bg-[#E8000D] px-2 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-balance break-words px-2 text-xs font-black uppercase tracking-wide text-white sm:text-sm">
                  🚨 LA MAFIA ROLANDÈSE VALIDE — JOURNÉE {matchdayNumber}
                </p>
              </div>
            ) : null}

            {/* 2. Scores */}
            <section className="space-y-3 pb-10" aria-labelledby="scores-heading">
              <SectionKicker id="scores-heading">Les scores</SectionKicker>
              <div>
                {matchesForMatchday.map((m) => {
                  const homeL = labelTeamId(managers, m.home_team_id)
                  const awayL = labelTeamId(managers, m.away_team_id)
                  const hs = m.home_score
                  const asco = m.away_score
                  const caption =
                    hs != null && asco != null
                      ? getScorelineLoreCaption(homeL, awayL, hs, asco)
                      : null
                  const total = hs != null && asco != null ? hs + asco : 0
                  const highScoring = total >= 6
                  return (
                    <div
                      key={m.id}
                      className="border-b border-white/[0.12] py-3 last:border-b-0"
                    >
                      <div
                        className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-x-2 text-sm sm:text-base"
                        style={{ minHeight: 44 }}
                      >
                        <p className="min-w-0 self-center break-words pr-1 text-left font-extrabold uppercase leading-tight text-white sm:text-sm">
                          {homeL}
                        </p>
                        <div className="flex min-w-0 flex-col items-center justify-center self-center text-center">
                          <span
                            className={cn(
                              "font-display tabular-nums text-white",
                              highScoring ? "text-[#3ddc84]" : ""
                            )}
                            style={{ fontSize: "1.5rem", lineHeight: 1.1 }}
                          >
                            {hs != null && asco != null ? (
                              `${hs} – ${asco}`
                            ) : (
                              <span className="text-2xl text-zinc-500">—</span>
                            )}
                          </span>
                        </div>
                        <p className="min-w-0 self-center break-words pl-1 text-right font-extrabold uppercase leading-tight text-white sm:text-sm">
                          {awayL}
                        </p>
                      </div>
                      {caption ? (
                        <p className="mt-1.5 text-pretty break-words text-xs italic sm:text-sm" style={{ color: "#E8000D" }}>
                          {caption}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        ) : data.matchDataStatus === "ready" && matchesForMatchday.length === 0 ? (
          <p className="pb-8 text-sm text-zinc-500">Aucun score saisi.</p>
        ) : null}

        {data.matchDataStatus === "ready" &&
        ((bonusHighlight && bonusHighlight.entries.length > 0) ||
          matchesForMatchday.length > 0 ||
          standingsAfter.length > 0) ? (
          <section className="space-y-3 pb-10" aria-label="Coups tordus de la journée">
            <article
              className="flex min-h-0 flex-col border border-white/5 bg-[#141414] pl-[3px]"
              style={{ borderLeft: "3px solid #3ddc84" }}
            >
              <div className="p-4 sm:p-5">
                <MatchdayNarrativeBonusSection
                  bonusHighlight={bonusHighlight}
                  variant="newspaper"
                  matchdayNumber={matchdayNumber}
                  matches={matchesForMatchday}
                  managers={managers}
                  standingsAfterMatchday={standingsAfter}
                />
              </div>
            </article>
          </section>
        ) : null}

        {/* 3. KPIs */}
        {data.matchDataStatus === "ready" && (
          <section className="space-y-3 pb-10" aria-labelledby="kpi-heading">
            <SectionKicker id="kpi-heading">Les grands récits</SectionKicker>
            <p className="text-xs text-zinc-500 sm:text-sm">
              Indicateurs narratifs sur la dynamique de saison (jusqu’à la dernière J disponible en données).
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {storyKpis.map((kpi) => (
                <MatchdayKpiBlock kpi={kpi} key={kpi.slug} />
              ))}
            </div>
          </section>
        )}

        {data.matchDataStatus === "ready" && perMatchLore.length > 0 && (
          <section className="space-y-3 pb-10" aria-labelledby="archives-heading">
            <SectionKicker id="archives-heading">Archives & contexte</SectionKicker>
            <ul className="space-y-4">
              {perMatchLore.map((item) => (
                <li
                  key={item.id}
                  className="border-l-[3px] pl-3 sm:pl-4"
                  style={{ borderColor: "#E8000D" }}
                >
                  <blockquote>
                    <p className="text-pretty break-words text-sm italic text-zinc-100 sm:text-base">
                      {item.hook}
                    </p>
                    <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-zinc-500">
                      Rivalité — {item.home} / {item.away} · {league.name}
                    </p>
                  </blockquote>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Courbe (fonctionnelle existante) */}
        {data.matchDataStatus === "ready" && (
          <section className="space-y-3 pb-10" aria-labelledby="courbe-heading">
            <SectionKicker id="courbe-heading">Courbe du suspens</SectionKicker>
            <p className="text-xs text-zinc-500 sm:text-sm">Jusqu’à J{matchdayNumber} — jusqu’à 4 courbes par coach.</p>
            <div className="newspaper-chart-surface overflow-hidden rounded-lg border border-white/10 bg-[#141414] p-0 [&_.text-foreground]:text-zinc-100 [&_.text-muted-foreground]:text-zinc-400 [&_button]:!border-zinc-600">
              <StandingsEvolutionChart
                standings={chartStandings}
                managers={chartManagers}
                leagueId={league.id}
                hideHeader
              />
            </div>
          </section>
        )}

        {/* 5. Classement rapide */}
        {data.matchDataStatus === "ready" && (
          <section className="space-y-3 pb-10" aria-labelledby="classement-heading">
            <SectionKicker id="classement-heading">Classement après J{matchdayNumber}</SectionKicker>
            {sortedAfter.length === 0 ? (
              <p className="text-sm text-zinc-500">Pas encore de tableau pour cette J.</p>
            ) : (
              <div className="w-full min-w-0 border border-white/8 bg-[#141414] p-0">
                <table className="w-full table-auto border-collapse text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-zinc-500">
                      <th className="px-2 py-2 sm:px-3 w-8">#</th>
                      <th className="px-0 py-2 pr-1">Équipe</th>
                      <th className="px-1 py-2 text-right tabular-nums">Pts</th>
                      <th className="hidden px-1 py-2 text-right tabular-nums sm:table-cell w-20">+ / −</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAfter.map((row) => {
                      const mgr = managers.find((m) => m.id === row.manager_id)
                      const name = mgr ? labelManager(mgr) : "—"
                      const gf = row.goals_for ?? 0
                      const ga = row.goals_against ?? 0
                      const diff = gf - ga
                      const isMine = row.manager_id === highlightManagerId
                      return (
                        <tr
                          key={row.id}
                          className={cn("border-t border-white/8", rowTextClass(row.rank))}
                        >
                          <td
                            className={cn(
                              "px-1 py-2.5 pl-0 sm:px-2 sm:pl-0 font-mono text-xs font-bold tabular-nums sm:text-sm",
                              isMine && "border-l-[3px] border-[#3ddc84] pl-2 sm:pl-2"
                            )}
                          >
                            {row.rank}
                          </td>
                          <td
                            className={cn(
                              "min-w-0 break-words py-2.5 pl-0 pr-1 text-xs font-bold uppercase sm:text-sm"
                            )}
                          >
                            {name}
                          </td>
                          <td className="px-1 py-2.5 text-right text-xs font-bold tabular-nums sm:text-sm">
                            {row.points ?? 0}
                          </td>
                          <td
                            className={cn(
                              "hidden px-1 py-2.5 text-right text-xs font-mono font-semibold tabular-nums sm:table-cell"
                            )}
                          >
                            {diff >= 0 ? `+${diff}` : String(diff)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 6. Partage + nav */}
        <div className="space-y-4 border-t border-white/10 pt-6 pb-4">
          <ShareButton
            shareUrl={shareUrl}
            title={`${league.name} — J${matchdayNumber}`}
          />
          {episodePrevNum == null && episodeNextNum == null ? null : (
            <nav
              className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2"
              aria-label="Journée précédente ou suivante"
            >
              {episodePrevNum != null ? (
                <Link
                  className="flex min-h-12 w-full min-w-0 items-center justify-center break-words border border-white/15 bg-[#1a1a1a] px-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:border-[#3ddc84]/30 hover:text-[#3ddc84]"
                  href={`/ligue/${encodeURIComponent(league.slug)}/j/${episodePrevNum}${seasonQuery}`}
                >
                  ← Journée {episodePrevNum}
                </Link>
              ) : (
                <span
                  className="flex min-h-12 w-full min-w-0 items-center justify-center break-words border border-white/5 bg-black/20 px-3 text-center text-xs font-black uppercase text-zinc-500"
                  aria-disabled
                >
                  — Début
                </span>
              )}
              {episodeNextNum != null ? (
                <Link
                  className="flex min-h-12 w-full min-w-0 items-center justify-center break-words border border-white/15 bg-[#1a1a1a] px-3 text-center text-xs font-black uppercase tracking-wide text-white transition hover:border-[#3ddc84]/30 hover:text-[#3ddc84]"
                  href={`/ligue/${encodeURIComponent(league.slug)}/j/${episodeNextNum}${seasonQuery}`}
                >
                  Journée {episodeNextNum} →
                </Link>
              ) : (
                <span
                  className="flex min-h-12 w-full min-w-0 items-center justify-center break-words border border-white/5 bg-black/20 px-3 text-center text-xs font-black uppercase text-zinc-500"
                  aria-disabled
                >
                  Fin de saison —
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
