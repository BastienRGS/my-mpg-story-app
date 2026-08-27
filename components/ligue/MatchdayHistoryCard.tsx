"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type MatchdayHistoryCardProps = {
  leagueSlug: string
  seasonId?: string | null
  matchdayNumber: number
  displayTitle: string
  dateLabel: string | null
  bestMatchLabel: string | null
  modalMatches: Array<{
    homeLabel: string
    awayLabel: string
    homeScore: number | null
    awayScore: number | null
  }>
  standingsRows: Array<{
    rank: number
    teamLabel: string
    points: number
    goalsFor: number
    goalsAgainst: number
  }>
  standingsAvailable: boolean
  standingsUnavailableReason: string | null
}

export function MatchdayHistoryCard(props: MatchdayHistoryCardProps) {
  const {
    leagueSlug,
    seasonId,
    matchdayNumber,
    displayTitle,
    dateLabel,
    bestMatchLabel,
    modalMatches,
    standingsRows,
    standingsAvailable,
    standingsUnavailableReason,
  } = props

  const safeSlug = encodeURIComponent(leagueSlug)
  const seasonQuery = seasonId ? `?season=${encodeURIComponent(seasonId)}` : ""
  const fullHref = `/ligue/${safeSlug}/j/${matchdayNumber}${seasonQuery}`

  return (
    <Card className="gap-0 py-4 shadow-sm">
      <CardHeader className="gap-1 px-4 pb-2 pt-0">
        <p className="text-base font-semibold leading-tight text-foreground">{displayTitle}</p>
        {dateLabel ? (
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3 pt-0">
        {bestMatchLabel ? (
          <p className="text-sm leading-snug text-foreground">
            <span className="text-muted-foreground">Match le plus riche en buts : </span>
            {bestMatchLabel}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun score complet pour cette journée.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-border/60 px-4 pb-0 pt-3 sm:flex-row sm:justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
              Voir la journée →
            </Button>
          </DialogTrigger>
          <DialogContent
            className="flex max-h-[min(85vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
            showCloseButton
          >
            <div className="overflow-y-auto p-6 pb-4">
              <DialogHeader>
                <DialogTitle>{displayTitle}</DialogTitle>
                <DialogDescription>
                  Résultats et classement après cette journée (données calculées depuis les matchs saisis).
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <section aria-labelledby={`history-results-${matchdayNumber}`}>
                  <h3
                    id={`history-results-${matchdayNumber}`}
                    className="mb-2 text-sm font-semibold text-foreground"
                  >
                    Tous les résultats
                  </h3>
                  {modalMatches.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {modalMatches.map((m, i) => (
                        <li
                          key={i}
                          className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2"
                        >
                          <span className="font-medium text-foreground">
                            {m.homeLabel} — {m.awayLabel}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {m.homeScore ?? "—"} – {m.awayScore ?? "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun match enregistré.</p>
                  )}
                </section>

                <section aria-labelledby={`history-standings-${matchdayNumber}`}>
                  <h3
                    id={`history-standings-${matchdayNumber}`}
                    className="mb-2 text-sm font-semibold text-foreground"
                  >
                    Classement après {displayTitle.toLowerCase()}
                  </h3>
                  {standingsAvailable && standingsRows.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Équipe</TableHead>
                          <TableHead className="text-right">Pts</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">BP</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">BC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standingsRows.map((r, idx) => (
                          <TableRow key={`${matchdayNumber}-st-${idx}`}>
                            <TableCell className="font-semibold tabular-nums">{r.rank}</TableCell>
                            <TableCell className="font-medium">{r.teamLabel}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.points}</TableCell>
                            <TableCell className="text-right tabular-nums hidden sm:table-cell">
                              {r.goalsFor}
                            </TableCell>
                            <TableCell className="text-right tabular-nums hidden sm:table-cell">
                              {r.goalsAgainst}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : standingsAvailable ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun résultat validé pour cette journée — pas de snapshot de classement associé.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {standingsUnavailableReason ??
                        "Pas assez de données valides pour afficher le classement."}
                    </p>
                  )}
                </section>
              </div>
            </div>

            <DialogFooter className="border-t border-border bg-muted/10 px-6 py-4 sm:justify-start">
              <Button asChild className="w-full sm:w-auto">
                <Link href={fullHref}>Voir la journée complète</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
