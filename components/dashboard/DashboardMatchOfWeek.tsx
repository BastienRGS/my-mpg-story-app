import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { ManagerWithTeam, ValidatedMatchRow } from "@/lib/types"
import { cn } from "@/lib/utils"

function labelTeam(managers: ManagerWithTeam[], teamId: string): string {
  const m = managers.find((x) => x.team?.id === teamId)
  return m ? m.team?.name || m.name : "Équipe"
}

type Props = {
  managers: ManagerWithTeam[]
  matchdayNumber: number
  row: ValidatedMatchRow | null
  /** Titre de section (défaut : Match de la semaine) */
  sectionHeading?: string
}

export function DashboardMatchOfWeek({
  managers,
  matchdayNumber,
  row,
  sectionHeading = "Match de la semaine",
}: Props) {
  if (!row) {
    return (
      <section className="space-y-3" aria-labelledby="motw-title">
        <h2 id="motw-title" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {sectionHeading}
        </h2>
        <Card className="border-dashed border-border bg-muted/10 shadow-none">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Pas encore assez de résultats pour désigner le match le plus spectaculaire de la J{matchdayNumber}.
          </CardContent>
        </Card>
      </section>
    )
  }

  const home = labelTeam(managers, row.home_team_id)
  const away = labelTeam(managers, row.away_team_id)

  return (
    <section className="space-y-3" aria-labelledby="motw-title">
      <h2 id="motw-title" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {sectionHeading}
      </h2>
      <Card className="overflow-hidden border-border bg-card shadow-none">
        <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-base sm:text-lg">Le choc de la J{matchdayNumber}</CardTitle>
          <CardDescription>Le match avec le plus de buts au compteur (à égalité, écart de score décisif).</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex flex-1 flex-col items-center text-center sm:items-end sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Domicile</p>
              <p className="mt-1 text-balance text-lg font-bold text-foreground sm:text-xl">{home}</p>
            </div>
            <div
              className={cn(
                "flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary/10 px-6 py-4 ring-2 ring-primary/30 sm:px-10 sm:py-6"
              )}
            >
              <span className="font-display text-4xl tabular-nums text-primary sm:text-5xl lg:text-6xl">
                {row.home_score}
              </span>
              <span className="text-2xl font-bold text-muted-foreground sm:text-3xl" aria-hidden>
                –
              </span>
              <span className="font-display text-4xl tabular-nums text-primary sm:text-5xl lg:text-6xl">
                {row.away_score}
              </span>
            </div>
            <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Extérieur</p>
              <p className="mt-1 text-balance text-lg font-bold text-foreground sm:text-xl">{away}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
