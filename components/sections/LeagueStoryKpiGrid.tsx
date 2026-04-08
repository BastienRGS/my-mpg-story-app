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

export function LeagueStoryKpiCard({ kpi, compact }: { kpi: LeagueStoryKpi; compact?: boolean }) {
  const Icon = iconFor[kpi.slug]
  return (
    <Card
      className={cn(
        "border-border bg-card shadow-none transition-colors",
        kpi.hasData && "border-border/80"
      )}
    >
      <CardContent
        className={cn(
          "flex",
          compact ? "gap-2.5 p-3 sm:gap-3 sm:p-4" : "gap-3 p-4 sm:gap-4 sm:p-5"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg sm:rounded-xl",
            compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-11 w-11 sm:h-12 sm:w-12",
            accentFor[kpi.slug]
          )}
        >
          <Icon className={cn(compact ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5 sm:h-6 sm:w-6")} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-semibold uppercase tracking-wide text-muted-foreground",
              compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"
            )}
          >
            {kpi.title}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate font-bold text-foreground",
              compact ? "text-sm sm:text-base" : "mt-1 text-base sm:text-lg"
            )}
          >
            {kpi.teamLabel || kpi.managerName}
          </p>
          <p
            className={cn(
              "truncate text-muted-foreground",
              compact ? "text-[11px] sm:text-xs" : "mt-0.5 text-xs sm:text-sm"
            )}
          >
            {kpi.managerName}
          </p>
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              compact ? "mt-1 line-clamp-2 text-[11px] sm:text-xs" : "mt-2 text-xs sm:text-sm"
            )}
          >
            {kpi.detail}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface LeagueStoryKpiGridProps {
  kpis: LeagueStoryKpi[]
  /** Titre de section (défaut : Les grands récits) */
  sectionTitle?: string
  sectionDescription?: string
  compact?: boolean
}

export function LeagueStoryKpiGrid({
  kpis,
  sectionTitle = "Les grands récits",
  sectionDescription = "Indicateurs calculés à partir des résultats et du classement — pas de saisie manuelle.",
  compact,
}: LeagueStoryKpiGridProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <header className="space-y-1 px-0.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{sectionTitle}</h2>
        {sectionDescription ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{sectionDescription}</p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <LeagueStoryKpiCard key={kpi.slug} kpi={kpi} compact={compact} />
        ))}
      </div>
    </section>
  )
}
