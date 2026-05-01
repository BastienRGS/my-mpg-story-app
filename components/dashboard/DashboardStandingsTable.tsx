import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ManagerWithTeam, StandingsHistoryWithManager } from "@/lib/types"
import { cn } from "@/lib/utils"

function labelManager(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

type Props = {
  managers: ManagerWithTeam[]
  standingsAfterMatchday: StandingsHistoryWithManager[]
  matchdayNumber: number
}

export function DashboardStandingsTable({ managers, standingsAfterMatchday, matchdayNumber }: Props) {
  const sorted = [...standingsAfterMatchday].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return (b.points ?? 0) - (a.points ?? 0)
  })

  return (
    <section className="space-y-3 pb-2" aria-labelledby="standings-heading">
      <h2 id="standings-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        Classement
      </h2>
      <p className="text-sm text-muted-foreground">Après la J{matchdayNumber} — le tableau complet.</p>
      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune ligne de classement pour cette journée.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Équipe</TableHead>
              <TableHead className="text-right">Pts</TableHead>
              <TableHead className="text-right hidden sm:table-cell">BP</TableHead>
              <TableHead className="text-right hidden sm:table-cell">BC</TableHead>
              <TableHead className="text-right hidden md:table-cell">Forme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, idx) => {
              const mgr = managers.find((m) => m.id === row.manager_id)
              const n = sorted.length
              const isPromotionRow = idx < 2
              const isRelegationRow = idx >= n - 2
              const overlap = isPromotionRow && isRelegationRow
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    overlap && "text-foreground",
                    !overlap && isPromotionRow && "text-[#3ddc84]",
                    !overlap && isRelegationRow && "text-[#ff4444]"
                  )}
                >
                  <TableCell className="font-display tabular-nums">{row.rank}</TableCell>
                  <TableCell className="font-medium">{mgr ? labelManager(mgr) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.points ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {row.goals_for ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {row.goals_against ?? 0}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "hidden text-right text-xs text-muted-foreground md:table-cell tracking-wider"
                    )}
                  >
                    {row.form ?? "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
