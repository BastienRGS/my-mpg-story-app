"use client"

import { useMemo, useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { HeroHeadline } from "@/components/sections/HeroHeadline"
import { SeasonBattle } from "@/components/sections/SeasonBattle"
import { LeagueStoryKpiGrid } from "@/components/sections/LeagueStoryKpiGrid"
import { EpisodeOfWeek } from "@/components/sections/EpisodeOfWeek"
import { PressRoom } from "@/components/sections/PressRoom"
import { SeasonTimeline } from "@/components/sections/SeasonTimeline"
import { ManagerIdentities } from "@/components/sections/ManagerIdentities"
import { AlertCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { DashboardData } from "@/lib/types"
import {
  buildEpisodeTeaser,
  computeLeagueStoryKpis,
  snapshotLatestStandings,
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
    articles,
    validatedMatchRows,
    matchDataStatus,
    matchDataIssues,
    timelineEvents,
    currentMatchday,
  } = data

  const storyKpis = useMemo(
    () => computeLeagueStoryKpis(managers, standingsHistory, validatedMatchRows),
    [managers, standingsHistory, validatedMatchRows]
  )

  const editorialTeaser = useMemo(() => {
    const snap = snapshotLatestStandings(managers, standingsHistory)
    if (!snap) return null
    return buildEpisodeTeaser({
      leagueName: league?.name ?? "La ligue",
      matchdayNumber: snap.matchdayNumber,
      leaderLabel: snap.leaderDisplay,
      lastPlaceLabel: snap.lastPlaceDisplay,
    })
  }, [league?.name, managers, standingsHistory])

  if (!league || !season) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="max-w-md space-y-3 text-center sm:space-y-4">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Aucune ligue trouvée</h1>
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
        <Sidebar />
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
            <Sidebar className="border-0" />
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
          <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:space-y-10 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {matchDataStatus === "load_error" || matchDataStatus === "invalid" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>
                  {matchDataStatus === "load_error"
                    ? "Impossible de charger les résultats"
                    : "Résultats invalides — classement désactivé"}
                </AlertTitle>
                <AlertDescription>
                  <p className="mb-2 text-sm">
                    Le dashboard n’utilise que la table « matches ». Corrigez les points ci-dessous ;
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
                  (matchday_id, équipes, scores). Le classement et les KPIs se mettent à jour après
                  validation.
                </AlertDescription>
              </Alert>
            ) : null}

            <HeroHeadline
              league={league}
              season={season}
              currentMatchday={currentMatchday}
              standingsHistory={standingsHistory}
            />

            <SeasonBattle
              leagueId={league.id}
              managers={managers}
              standingsHistory={standingsHistory}
            />

            <LeagueStoryKpiGrid kpis={storyKpis} />

            <EpisodeOfWeek
              leagueName={league.name}
              editorialTeaser={editorialTeaser}
              currentMatchday={currentMatchday}
            />

            <div className="space-y-8 border-t border-border/60 pt-2 sm:space-y-10">
              <PressRoom articles={articles} />
              <SeasonTimeline timelineEvents={timelineEvents} />
              <ManagerIdentities managers={managers} />
            </div>

            <div className="h-6 sm:h-8" />
          </div>
        </main>
      </div>
    </div>
  )
}
