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
  hot_coach: "bg-[#3ddc8415] text-[#3ddc84]",
  crisis_coach: "border border-[#ff444440] bg-[#2a0a0a] text-[#ff4444]",
  defensive_wall: "bg-muted text-muted-foreground",
  nuclear_attack: "bg-[#3ddc8415] text-[#3ddc84]",
  comeback: "bg-[#3ddc8415] text-[#3ddc84]",
  leader_pressure: "bg-[#3ddc8415] text-[#3ddc84]",
  match_of_round: "bg-[#ffd700]/15 text-[#ffd700]",
}

export function LeagueStoryKpiCard({ kpi, compact }: { kpi: LeagueStoryKpi; compact?: boolean }) {
  const Icon = iconFor[kpi.slug]
  return (
    <Card
      className={cn(
        "border-border bg-card py-2 shadow-none transition-colors",
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
              "font-semibold uppercase tracking-[0.2em] text-[rgba(61,220,132,1)]",
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
          {kpi.loreSubtitle ? (
            <p
              title={kpi.loreSubtitle}
              className={cn(
                "italic text-foreground/80",
                compact ? "mt-1 line-clamp-3 text-[10px] sm:text-[11px]" : "mt-1.5 line-clamp-3 text-[11px] sm:text-xs"
              )}
            >
              {kpi.loreSubtitle}
            </p>
          ) : null}
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
    <section className="mb-10 space-y-3 sm:space-y-4">
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
