import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Star, ThumbsDown, ArrowRight, Quote } from "lucide-react"
import type { Matchday } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EpisodeOfWeekProps {
  leagueName: string
  leagueSlug: string
  /** One-line editorial hook (e.g. from standings snapshot). */
  editorialTeaser?: string | null
  currentMatchday?: Matchday | null
}

const MOCK_HEADLINE = "La semaine où les certitudes ont volé en éclats"
const MOCK_DECK =
  "Penalty litigieux, remontada improbable et groupe WhatsApp en feu : retour sur une journée qui restera dans les annales du canapé."

export function EpisodeOfWeek({ leagueName, leagueSlug, editorialTeaser, currentMatchday }: EpisodeOfWeekProps) {
  if (!currentMatchday) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <header className="space-y-1 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">À la une</p>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Épisode de la semaine</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bientôt : le récit auto de chaque journée pour {leagueName}.
          </p>
        </header>

        <Card className="overflow-hidden border-border bg-gradient-to-br from-secondary/40 to-card shadow-none">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex gap-3 rounded-xl bg-background/50 p-3 ring-1 ring-border/60">
              <Quote className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
              <p className="text-sm italic leading-relaxed text-muted-foreground">
                « Ici vivra le résumé narratif de votre ligue : ton, twists, héros et flops. Pour l’instant,
                place au teaser. »
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aperçu éditorial
              </p>
              <h3 className="mt-1 text-balance text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {MOCK_HEADLINE}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{MOCK_DECK}</p>
            </div>
            <Button variant="secondary" className="w-full gap-2 sm:w-auto" disabled>
              Bientôt disponible
              <ArrowRight className="h-4 w-4 opacity-50" />
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  const episodeNumber = currentMatchday.number
  const episodeTitle = currentMatchday.title || `Journée ${episodeNumber} — le récit`

  return (
    <section className="space-y-3 sm:space-y-4">
      <header className="space-y-1 px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">À la une</p>
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Épisode de la semaine</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le fil rouge de {leagueName} après la dernière journée jouée.
        </p>
      </header>

      <Card className="overflow-hidden border-border bg-card shadow-none">
        <CardContent className="p-0">
          {editorialTeaser ? (
            <div className="border-b border-border/80 bg-muted/25 px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-pretty text-sm font-medium leading-relaxed text-foreground sm:text-base">
                {editorialTeaser}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="border-border p-5 sm:p-6 lg:col-span-2 lg:p-8">
              <div className="mb-4 flex items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary sm:h-12 sm:w-12">
                  <Play className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
                    Épisode {episodeNumber}
                  </p>
                  <h3 className="text-balance text-xl font-bold leading-tight text-foreground sm:text-2xl">
                    {episodeTitle}
                  </h3>
                </div>
              </div>

              <div className="mb-5">
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                    currentMatchday.status === "completed" && "bg-primary/20 text-primary",
                    currentMatchday.status === "in_progress" && "bg-accent/20 text-accent",
                    currentMatchday.status !== "completed" &&
                      currentMatchday.status !== "in_progress" &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {currentMatchday.status === "completed"
                    ? "Terminé"
                    : currentMatchday.status === "in_progress"
                      ? "En cours"
                      : "À venir"}
                </span>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Chaque journée réécrit l&apos;histoire de votre ligue : rebondissements au classement, messages
                assassins sur le groupe, et ce petit joueur qui a tout changé en un week-end.
              </p>

              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link
                  href={`/ligue/${encodeURIComponent(leagueSlug)}/j/${currentMatchday.number}`}
                >
                  Lire l&apos;analyse complète
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="border-t border-border bg-secondary/15 lg:border-l lg:border-t-0">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-accent sm:text-xs">
                    Héros de la semaine
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Le meneur qui a fait basculé la J{episodeNumber} — bientôt relié aux vrais matchs MPG.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-destructive sm:text-xs">
                    Flop de la semaine
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Celui qu&apos;on ne nommera pas tout de suite… sauf sur le groupe à 23h.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
