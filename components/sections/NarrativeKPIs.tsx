import { Card, CardContent } from "@/components/ui/card"
import {
  Crown,
  CloudLightning,
  Flame,
  Shuffle,
  Shield,
  Zap,
  TrendingDown,
  Brain,
  Trophy,
  Target
} from "lucide-react"
import type { NarrativeKpi, ManagerWithTeam } from "@/lib/types"

const iconMap: Record<string, React.ElementType> = {
  Crown,
  CloudLightning,
  Flame,
  Shuffle,
  Shield,
  Zap,
  TrendingDown,
  Brain,
  Trophy,
  Target
}

interface NarrativeKPIsProps {
  narrativeKpis: NarrativeKpi[]
  managers: ManagerWithTeam[]
}

/** @deprecated Non branché au dashboard — KPIs via `computeLeagueStoryKpis` + table `matches`. */
export function NarrativeKPIs({ narrativeKpis, managers }: NarrativeKPIsProps) {
  // If no KPIs, show empty state
  if (narrativeKpis.length === 0) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Les personnalités de la saison
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Les distinctions qui racontent le caractère de cette ligue
          </p>
        </header>
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12">
          Aucun arc narratif enregistré pour le moment.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Les personnalités de la saison
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les distinctions qui racontent le caractère de cette ligue
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {narrativeKpis.slice(0, 8).map((kpi) => {
          const Icon = iconMap[kpi.slug] || Crown
          const managerWithTeam = managers.find((m) => m.id === kpi.manager_id)
          const manager = managerWithTeam ?? kpi.manager
          const teamName = managerWithTeam?.team?.name || manager?.name || "Équipe"

          return (
            <Card
              key={kpi.id}
              className="border-border bg-card shadow-none transition-colors hover:border-primary/40"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {kpi.title}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                      {teamName}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {manager?.name || "Manager"}
                    </span>
                    {kpi.stat_value ? (
                      <span className="text-xs font-semibold text-primary">
                        {kpi.stat_value}
                      </span>
                    ) : null}
                  </div>
                  {kpi.description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {kpi.description}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
