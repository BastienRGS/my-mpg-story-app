import { Card, CardContent } from "@/components/ui/card"
import {
  Flame,
  CloudRain,
  Shield,
  Zap,
  TrendingUp,
  Crown,
  Sparkles,
} from "lucide-react"
import type { LeagueStoryKpi, LeagueStoryKpiSlug } from "@/lib/league-story-kpis"
import { cn } from "@/lib/utils"

const iconFor: Record<LeagueStoryKpiSlug, typeof Flame> = {
  hot_coach: Flame,
  crisis_coach: CloudRain,
  defensive_wall: Shield,
  nuclear_attack: Zap,
  comeback: TrendingUp,
  leader_pressure: Crown,
  match_of_round: Sparkles,
}

const accentFor: Record<LeagueStoryKpiSlug, string> = {
  hot_coach: "bg-chart-1/15 text-chart-1",
  crisis_coach: "bg-destructive/10 text-destructive",
  defensive_wall: "bg-muted text-muted-foreground",
  nuclear_attack: "bg-accent/15 text-accent",
  comeback: "bg-primary/15 text-primary",
  leader_pressure: "bg-chart-2/15 text-chart-2",
  match_of_round: "bg-chart-3/15 text-chart-3",
}

interface LeagueStoryKpiGridProps {
  kpis: LeagueStoryKpi[]
}

export function LeagueStoryKpiGrid({ kpis }: LeagueStoryKpiGridProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <header className="space-y-1 px-0.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Les grands récits</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Indicateurs calculés à partir des résultats et du classement — pas de saisie manuelle.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = iconFor[kpi.slug]
          return (
            <Card
              key={kpi.slug}
              className={cn(
                "border-border bg-card shadow-none transition-colors",
                kpi.hasData && "border-border/80"
              )}
            >
              <CardContent className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
                    accentFor[kpi.slug]
                  )}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-foreground sm:text-lg">
                    {kpi.teamLabel || kpi.managerName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{kpi.managerName}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{kpi.detail}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
