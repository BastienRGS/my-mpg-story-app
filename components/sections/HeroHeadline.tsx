import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Trophy, Flame, AlertTriangle } from "lucide-react"
import type { League, Matchday, Season, StandingsHistoryWithManager } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeroHeadlineProps {
  league: League
  season: Season
  currentMatchday?: Matchday | null
  standingsHistory: StandingsHistoryWithManager[]
}

function matchdayStatusLabel(status: string | null | undefined): string {
  if (status === "completed") return "Journée terminée"
  if (status === "in_progress") return "Journée en cours"
  return "Prochaine manche"
}

export function HeroHeadline({
  league,
  season,
  currentMatchday,
  standingsHistory,
}: HeroHeadlineProps) {
  const latestMatchday =
    standingsHistory.length > 0
      ? Math.max(...standingsHistory.map((s) => s.matchday_number))
      : 0

  const latestStandings = standingsHistory.filter((s) => s.matchday_number === latestMatchday)
  const leaderStanding = latestStandings.find((s) => s.rank === 1)
  const leader = leaderStanding?.manager?.name || "À déterminer"
  const leaderForm = leaderStanding?.form?.trim() || null

  const lastPlaceStanding = latestStandings.reduce(
    (prev, current) => (current.rank > (prev?.rank || 0) ? current : prev),
    latestStandings[0]
  )
  const underPressure = lastPlaceStanding?.manager?.name || "À déterminer"

  const matchdayNumber = currentMatchday?.number || latestMatchday || 1
  const totalMatchdays = season.total_matchdays ?? null
  const mdStatus = currentMatchday?.status ?? null

  const headline =
    currentMatchday?.title || `Après la J${matchdayNumber}, le récit continue`
  const summary = `${leader} caracole en tête du classement. ${underPressure} subit la pression en bas du tableau — et chaque journée peut tout renverser.`

  return (
    <section className="space-y-4 sm:space-y-5">
      {/* Masthead: ligue + saison + contexte J — compact sur mobile */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/95 to-background px-4 py-5 sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
            <span>Ligue privée</span>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <span className="rounded-full bg-background/60 px-2 py-0.5 text-foreground ring-1 ring-border/60">
              {season.name}
            </span>
          </div>

          <h1 className="text-balance text-2xl leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {league.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              J{matchdayNumber}
              {totalMatchdays != null ? (
                <span className="font-normal text-muted-foreground">/ {totalMatchdays}</span>
              ) : null}
            </span>
            <span className="text-border">·</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs",
                mdStatus === "completed" && "bg-primary/15 text-primary",
                mdStatus === "in_progress" && "bg-accent/15 text-accent",
                (mdStatus == null || mdStatus === "scheduled" || mdStatus === "") &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {matchdayStatusLabel(mdStatus)}
            </span>
          </div>

          <div className="border-t border-border/60 pt-4">
            <h2 className="text-balance text-lg font-bold leading-snug text-foreground sm:text-xl lg:text-2xl">
              {headline}
            </h2>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Story beats — 2×2 on small, 4 cols xl */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Card className="border-border bg-card shadow-none">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Calendrier</p>
                <p className="truncate text-sm font-bold text-foreground sm:text-base">
                  {totalMatchdays != null ? `J${matchdayNumber}/${totalMatchdays}` : `J${matchdayNumber}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 sm:h-10 sm:w-10">
                <Trophy className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Leader</p>
                <p className="truncate text-sm font-bold text-foreground sm:text-base">{leader}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-1/10 sm:h-10 sm:w-10">
                <Flame className="h-4 w-4 text-chart-1 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Forme du leader</p>
                <p className="line-clamp-2 font-mono text-sm font-bold leading-tight text-foreground sm:text-base">
                  {leaderForm || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-none">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 sm:h-10 sm:w-10">
                <AlertTriangle className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Pression</p>
                <p className="truncate text-sm font-bold text-foreground sm:text-base">{underPressure}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
