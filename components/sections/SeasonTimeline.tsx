import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Flag,
  Crown,
  TrendingDown,
  Flame,
  AlertTriangle,
  Rocket,
  Trophy,
  Star,
  Zap
} from "lucide-react"
import type { TimelineEvent } from "@/lib/types"

const iconMap: Record<string, React.ElementType> = {
  Flag,
  Crown,
  TrendingDown,
  Flame,
  AlertTriangle,
  Rocket,
  Trophy,
  Star,
  Zap
}

const iconColors: Record<string, string> = {
  Flag: "text-muted-foreground bg-muted",
  Crown: "text-accent bg-accent/20",
  TrendingDown: "text-destructive bg-destructive/20",
  Flame: "text-chart-5 bg-chart-5/20",
  AlertTriangle: "text-accent bg-accent/20",
  Rocket: "text-primary bg-primary/20",
  Trophy: "text-primary bg-primary/20",
  Star: "text-accent bg-accent/20",
  Zap: "text-chart-1 bg-chart-1/20"
}

interface SeasonTimelineProps {
  timelineEvents: TimelineEvent[]
}

export function SeasonTimeline({ timelineEvents }: SeasonTimelineProps) {
  // If no events, show empty state
  if (timelineEvents.length === 0) {
    return (
      <section>
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="space-y-1 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Fil de la saison
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              Les moments qui ont fait l&apos;histoire de la ligue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 sm:px-6">
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun événement enregistré pour le moment.
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="space-y-1 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Fil de la saison
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            Les moments qui ont fait l&apos;histoire de la ligue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <div className="relative">
            <div className="absolute bottom-0 left-[1.15rem] top-0 w-px bg-border sm:left-5" />

            <div className="space-y-5 sm:space-y-6">
              {timelineEvents.slice(0, 8).map((event) => {
                const iconKey = event.icon || "Flag"
                const Icon = iconMap[iconKey] || Flag
                const colorClass = iconColors[iconKey] || "text-muted-foreground bg-muted"

                return (
                  <div key={event.id} className="relative flex gap-3 pl-1 sm:gap-4 sm:pl-2">
                    <div
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1 pb-5 sm:pb-6">
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {event.matchday_number ? (
                          <span className="text-xs font-semibold text-primary">
                            J{event.matchday_number}
                          </span>
                        ) : null}
                        <h4 className="text-sm font-semibold leading-snug text-foreground">
                          {event.title}
                        </h4>
                      </div>
                      {event.description ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
