"use client"

import { useMemo, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { SeasonBattle } from "@/components/sections/SeasonBattle"
import { LeagueStoryKpiGrid } from "@/components/sections/LeagueStoryKpiGrid"
import { DashboardStoryHero } from "@/components/dashboard/DashboardStoryHero"
import { DashboardMatchOfWeek } from "@/components/dashboard/DashboardMatchOfWeek"
import Link from "next/link"
import { DashboardPunchline } from "@/components/dashboard/DashboardPunchline"
import { DashboardStandingsTable } from "@/components/dashboard/DashboardStandingsTable"
import { AlertCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { DashboardData } from "@/lib/types"
import {
  buildEditorialHeadlineSegments,
  buildDashboardSynthesisParagraphs,
  type StoryTextSegment,
} from "@/lib/dashboard-story-copy"
import { buildDynamicHeadline } from "@/lib/matchday-newspaper"
import { SeasonRecapSection } from "@/components/sections/SeasonRecapSection"
import {
  computeFormExtremeCoaches,
  computeLeaderStripKpi,
  computeLeagueStoryKpis,
  computeMatchOfRoundForMatchday,
  pickMatchOfRoundRow,
} from "@/lib/league-story-kpis"

interface DashboardClientProps {
  data: DashboardData
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const {
    league,
    season,
    allLeagues,
    managers,
    standingsHistory,
    validatedMatchRows,
    matchDataStatus,
    matchDataIssues,
    currentMatchday,
    matchdayPunchlineFromTable,
    bonusHighlight,
    matchdayHighlightedBonuses,
    matchResults,
    seasonRecap,
  } = data

  const lastMdFromStandings =
    standingsHistory.length > 0 ? Math.max(...standingsHistory.map((s) => s.matchday_number)) : null
  const matchdayNumber = currentMatchday?.number ?? lastMdFromStandings ?? 1
  const totalMatchdaysForSeason = season?.total_matchdays ?? 12

  const ready = matchDataStatus === "ready"

  const storyKpis = useMemo(
    () => computeLeagueStoryKpis(managers, standingsHistory, validatedMatchRows),
    [managers, standingsHistory, validatedMatchRows]
  )

  const leaderStrip = useMemo(
    () => computeLeaderStripKpi(managers, standingsHistory),
    [managers, standingsHistory]
  )

  const { best: formHot, worst: formCold } = useMemo(
    () => computeFormExtremeCoaches(managers, standingsHistory),
    [managers, standingsHistory]
  )

  const matchOfRoundKpi = useMemo(
    () =>
      ready
        ? computeMatchOfRoundForMatchday(managers, validatedMatchRows, matchdayNumber)
        : computeMatchOfRoundForMatchday(managers, [], matchdayNumber),
    [ready, managers, validatedMatchRows, matchdayNumber]
  )

  const motwRow = useMemo(
    () => (ready ? pickMatchOfRoundRow(validatedMatchRows, matchdayNumber) : null),
    [ready, validatedMatchRows, matchdayNumber]
  )

  const matchesForScoresDialog = useMemo(() => {
    if (!ready || matchResults.length === 0) return []
    return matchResults.filter((m) => m.matchday_number === matchdayNumber)
  }, [ready, matchResults, matchdayNumber])

  const standingsForScoresDialog = useMemo(() => {
    if (!ready || standingsHistory.length === 0) return []
    return standingsHistory.filter((s) => s.matchday_number === matchdayNumber)
  }, [ready, standingsHistory, matchdayNumber])

  const { heroSegments, heroDek } = useMemo((): { heroSegments: StoryTextSegment[]; heroDek: string } => {
    if (!ready) {
      return {
        heroSegments: buildEditorialHeadlineSegments({
          leagueName: league?.name ?? "La ligue",
          matchdayNumber,
          matchdayTitle: currentMatchday?.title,
          managers,
          standingsHistory,
          validatedMatchRows: [],
        }),
        heroDek:
          "Le championnat écrit son histoire match après match — prochaine mise à jour après les résultats.",
      }
    }
    const dyn = buildDynamicHeadline({
      matchdayNumber,
      totalMatchdays: totalMatchdaysForSeason,
      seasonName: season?.name ?? "",
      season: season ?? null,
      managers,
      standingsHistory,
      validatedMatchRows,
      highlightedBonusesThisMatchday: matchdayHighlightedBonuses,
    })
    return { heroSegments: [{ text: dyn.headline }], heroDek: dyn.intro }
  }, [
    ready,
    league?.name,
    matchdayNumber,
    currentMatchday?.title,
    managers,
    standingsHistory,
    validatedMatchRows,
    totalMatchdaysForSeason,
    season?.name,
    season?.total_matchdays,
    season,
    matchdayHighlightedBonuses,
  ])

  const synthesisParagraphs = useMemo((): [StoryTextSegment[], StoryTextSegment[], StoryTextSegment[]] => {
    if (!ready) {
      return [
        [{ text: "Les résultats ne sont pas encore prêts pour écrire le récit de cette ligue." }],
        [
          {
            text: "Dès que les matchs seront validés, la synthèse analysera les forces, les faiblesses et le match qui a fait vibrer la Journée.",
          },
        ],
        [
          {
            text: "Revenez après la prochaine mise à jour — le championnat reprend toujours sur le fil du groupe WhatsApp.",
          },
        ],
      ]
    }
    return buildDashboardSynthesisParagraphs({
      managers,
      standingsHistory,
      validatedRows: validatedMatchRows,
      matchdayNumber,
      leaderStrip,
      formBest: formHot,
      formWorst: formCold,
      matchOfRound: matchOfRoundKpi,
    })
  }, [
    ready,
    managers,
    standingsHistory,
    validatedMatchRows,
    matchdayNumber,
    leaderStrip,
    formHot,
    formCold,
    matchOfRoundKpi,
  ])

  const standingsAfter = useMemo(
    () => standingsHistory.filter((r) => r.matchday_number === matchdayNumber),
    [standingsHistory, matchdayNumber]
  )

  if (!league || !season) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="max-w-md space-y-3 text-center sm:space-y-4">
          <h1 className="text-xl text-foreground sm:text-2xl">Aucune ligue trouvée</h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Créez une ligue et une saison dans Supabase pour afficher le récit de la compétition.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar leagueSlug={league.slug} />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer le menu</span>
              </Button>
            </div>
            <Sidebar className="border-0" leagueSlug={league.slug} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          league={league}
          season={season}
          allLeagues={allLeagues}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-8 px-4 pt-2 pb-4 sm:space-y-10 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {matchDataStatus === "load_error" || matchDataStatus === "invalid" ? (
              <Alert variant={matchDataStatus === "load_error" ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>
                  {matchDataStatus === "load_error"
                    ? "Impossible de charger les résultats"
                    : "Résultats invalides — classement désactivé"}
                </AlertTitle>
                <AlertDescription>
                  <p className="mb-2 text-sm">
                    Le tableau de bord n’utilise que la table « matches ». Corrigez les points ci-dessous ;
                    aucun ancien classement manuel n’est affiché à la place.
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {matchDataIssues.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {matchDataStatus === "empty" ? (
              <Alert>
                <Info className="h-4 w-4" aria-hidden />
                <AlertTitle>Aucun résultat pour cette saison</AlertTitle>
                <AlertDescription className="text-sm">
                  Créez les lignes « matchdays » pour la saison, puis ajoutez les matchs dans « matches »
                  (matchday_id, équipes, scores). Le récit et le classement se mettent à jour après
                  validation.
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Masthead (hors carte) */}
            <div className="mb-4 min-w-0">
              <Link
                href="/"
                className="inline-flex min-w-0 max-w-full flex-col gap-1 py-2 sm:gap-1.5"
              >
                <div className="logotype masthead-wordmark flex flex-wrap items-baseline gap-x-1.5 gap-y-0 leading-[1.02] sm:gap-x-2">
                  <span className="text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl">
                    La Gazz
                  </span>
                  <span className="text-4xl font-bold tracking-[-0.03em] text-primary sm:text-5xl md:text-6xl">
                    attak
                  </span>
                </div>
                <div className="logotype-tagline w-full max-w-[42rem] text-pretty text-[13px] md:leading-relaxed">
                  Vos résultats, vos humiliations, votre gloire... ou pas !
                </div>
              </Link>
            </div>

            {/* Bilan fin de saison */}
            {season.is_finished === true && seasonRecap && (
              <SeasonRecapSection
                season={season}
                leagueSlug={league.slug}
                recap={seasonRecap}
              />
            )}

            {/* Hero unique : accroche + intro (dek) + sous-récits synthèse */}
            <DashboardStoryHero
              matchdayNumber={matchdayNumber}
              leagueName={league.name}
              seasonName={season.name}
              headlineSegments={heroSegments}
              dek={heroDek}
              synthesisParagraphs={synthesisParagraphs}
              bonusHighlight={bonusHighlight}
              matchesForMatchday={matchesForScoresDialog}
              managers={managers}
              standingsAfterMatchday={standingsForScoresDialog}
            />

            {/* Contenu sous le hero */}
            <div className="!mt-0 mb-0 box-content space-y-10 pt-4 sm:space-y-12">
              {/* Punchline */}
              <DashboardPunchline punchline={matchdayPunchlineFromTable} />

              {/* 4. Le choc */}
              <DashboardMatchOfWeek
                managers={managers}
                matchdayNumber={matchdayNumber}
                row={motwRow}
                sectionHeading="Le choc"
              />

              {/* 5. Grands récits */}
              <LeagueStoryKpiGrid
                kpis={storyKpis}
                sectionTitle="Les grands récits"
                sectionDescription="Sept angles calculés sur le classement et les derniers scores — lecture express."
                compact
              />

              {/* 6. La bataille pour le titre */}
              <section className="mb-10 space-y-3" aria-labelledby="season-battle-heading">
                <h2
                  id="season-battle-heading"
                  className="px-0.5 text-lg font-bold tracking-tight text-foreground sm:text-xl"
                >
                  La bataille pour le titre
                </h2>
                <SeasonBattle leagueId={league.id} managers={managers} standingsHistory={standingsHistory} />
              </section>

              {/* 7. Classement */}
              <DashboardStandingsTable
                managers={managers}
                standingsAfterMatchday={standingsAfter}
                matchdayNumber={matchdayNumber}
              />
            </div>

            <div className="h-6 sm:h-8" />
          </div>
        </main>
      </div>
    </div>
  )
}
