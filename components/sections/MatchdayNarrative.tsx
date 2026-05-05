"use client"

import { useState } from "react"
import type {
  BonusHighlightBlock,
  ManagerWithTeam,
  MatchdayScoresRow,
  StandingsHistoryWithManager,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { getManagerByTeamId, getMatchWinner } from "@/lib/matchday-newspaper"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  bonusHighlight: BonusHighlightBlock | null
  /** `dashboard` : carte « La synthèse » · `newspaper` : page épisode La Gazzattak */
  variant?: "dashboard" | "newspaper"
  /** Numéro de journée affiché sur le bouton / le titre du dialogue. */
  matchdayNumber?: number
  /** Matchs de la journée courante uniquement. */
  matches?: MatchdayScoresRow[]
  managers?: ManagerWithTeam[]
  /** Classement après cette journée (une ligne par manager). */
  standingsAfterMatchday?: StandingsHistoryWithManager[]
}

type VerdictKind = "genie" | "looser" | "chanceux"

/** Présentation uniquement : aligné sur les chaînes fixes de `getBonusNarrative` (lib/bonus-narrative.ts). */
function verdictFromHighlightEntry(narrative: string, bonusTypeLabel: string): VerdictKind {
  const t = narrative.toLowerCase()
  const label = bonusTypeLabel.toUpperCase()

  if (label === "MIROIR" || t.includes("miroir")) {
    if (t.includes("po po po") || t.includes("coup de maître") || t.includes("quel génie")) return "genie"
    if (t.includes("sauve un point in extremis") || t.includes("sauve un point")) return "chanceux"
    return "looser"
  }

  const looserSnippets = [
    "même zahia n'a pas réussi",
    "mais ses chèvres ont quand même réussi à perdre",
    "même en hackant le game",
    "ça ne passe pas",
    "c'est du grand n'importe quoi",
    "il a sorti la valise pour rien",
    "la valise est sortie, mais le but adverse reste",
    "looser !",
    "tonton pat' méritait mieux",
    "mcdo+ n'a pas suffi",
    "le capitaine ne joue pas",
    "même en sabotant les remplacements adverses",
  ]
  if (looserSnippets.some((s) => t.includes(s))) return "looser"

  const genieSnippets = [
    "zahia a tout donné",
    "vilain, vicieux, efficace",
    "un petit coup de pouce numérique",
    "tout pour l'attaque, rien pour la défense, et ça passe",
    "la valise sort au bon moment",
    "mcdo+ sur le bon joueur",
    "le brassard au bon joueur",
    "il a neutralisé le plan tactique",
  ]
  if (genieSnippets.some((s) => t.includes(s))) return "genie"

  return "looser"
}

const verdictPillClass: Record<VerdictKind, string> = {
  genie: "border border-[#3ddc8440] bg-[#0d2b1a] text-[#3ddc84]",
  looser: "border border-[#ff444440] bg-[#2a0a0a] text-[#ff4444]",
  chanceux: "border border-[#ffd70040] bg-[#1a1a0d] text-[#ffd700]",
}

const verdictLabelText: Record<VerdictKind, string> = {
  genie: "GÉNIE",
  looser: "LOOSER",
  chanceux: "CHANCEUX",
}

function identityLabelForTeam(teamId: string, managers: ManagerWithTeam[]): string {
  const m = getManagerByTeamId(teamId, managers)
  if (!m) return "—"
  const id = m.identity_label?.trim()
  if (id) return id
  return (m.team?.name ?? m.name).trim() || "—"
}

function identityLabelForManager(managerId: string, managers: ManagerWithTeam[]): string {
  const m = managers.find((x) => x.id === managerId)
  if (!m) return "—"
  const id = m.identity_label?.trim()
  if (id) return id
  return (m.team?.name ?? m.name).trim() || "—"
}

function MatchdayScoresDialog({
  open,
  onOpenChange,
  matchdayNumber,
  matches,
  standingsAfterMatchday,
  managers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchdayNumber: number
  matches: MatchdayScoresRow[]
  standingsAfterMatchday: StandingsHistoryWithManager[]
  managers: ManagerWithTeam[]
}) {
  const sortedStandings = [...standingsAfterMatchday].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return (b.points ?? 0) - (a.points ?? 0)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,720px)] max-w-[min(400px,calc(100%-2rem))] gap-4 sm:max-w-[400px]"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Résultats et classement — Journée {matchdayNumber}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(72vh,560px)] space-y-6 overflow-y-auto pr-0.5">
          {matches.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matchs</p>
              {matches.map((match, i) => {
                const homeName = identityLabelForTeam(match.home_team_id, managers)
                const awayName = identityLabelForTeam(match.away_team_id, managers)
                const hs = match.home_score
                const asco = match.away_score
                const hasScores = hs != null && asco != null
                const total = hasScores ? hs + asco : 0
                const highScoring = hasScores && total >= 6
                const outcome = hasScores
                  ? getMatchWinner({ home_score: hs, away_score: asco })
                  : ("draw" as const)

                const homeSideClass = cn(
                  "min-w-0 flex-1 text-right text-sm",
                  outcome === "home" && "font-bold text-foreground",
                  outcome === "away" && "text-muted-foreground",
                  outcome === "draw" && "text-foreground"
                )
                const awaySideClass = cn(
                  "min-w-0 flex-1 text-left text-sm",
                  outcome === "away" && "font-bold text-foreground",
                  outcome === "home" && "text-muted-foreground",
                  outcome === "draw" && "text-foreground"
                )

                return (
                  <div key={match.id}>
                    {i > 0 ? <Separator className="my-3" /> : null}
                    <div className="flex items-center gap-2">
                      <p className={homeSideClass}>{homeName}</p>
                      <span
                        className={cn(
                          "min-w-16 shrink-0 text-center text-sm font-bold tabular-nums",
                          highScoring ? "text-primary" : "text-foreground"
                        )}
                      >
                        {hasScores ? `${hs} — ${asco}` : "— —"}
                      </span>
                      <p className={awaySideClass}>{awayName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {matches.length > 0 && sortedStandings.length > 0 ? (
            <Separator className="bg-border" />
          ) : null}

          {sortedStandings.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Classement après J{matchdayNumber}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 w-10 px-1 text-xs">#</TableHead>
                    <TableHead className="h-8 px-1 text-xs">Équipe</TableHead>
                    <TableHead className="h-8 w-11 px-1 text-right text-xs">Pts</TableHead>
                    <TableHead className="hidden h-8 w-11 px-1 text-right text-xs sm:table-cell">+/-</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStandings.map((row) => {
                    const gf = row.goals_for ?? 0
                    const ga = row.goals_against ?? 0
                    const diff = gf - ga
                    const diffLabel = diff > 0 ? `+${diff}` : String(diff)
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="px-1 py-1.5 font-display text-xs tabular-nums">
                          {row.rank}
                        </TableCell>
                        <TableCell className="max-w-[10rem] truncate px-1 py-1.5 text-xs font-medium">
                          {identityLabelForManager(row.manager_id, managers)}
                        </TableCell>
                        <TableCell className="px-1 py-1.5 text-right text-xs tabular-nums">
                          {row.points ?? "—"}
                        </TableCell>
                        <TableCell className="hidden px-1 py-1.5 text-right text-xs tabular-nums text-muted-foreground sm:table-cell">
                          {diffLabel}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Bloc narratif des bonus mis en avant (entre Héros du jour et Impact classement sur le dashboard).
 * Peut afficher un bouton + dialogue des scores si `matches` / `managers` / `matchdayNumber` sont fournis.
 */
export function MatchdayNarrativeBonusSection({
  bonusHighlight,
  variant = "dashboard",
  matchdayNumber,
  matches,
  managers,
  standingsAfterMatchday,
}: Props) {
  const [scoresOpen, setScoresOpen] = useState(false)

  const hasBonus = Boolean(bonusHighlight && bonusHighlight.entries.length > 0)
  const matchList = matches ?? []
  const standingsList = standingsAfterMatchday ?? []
  const hasMatchRows = matchList.length > 0
  const hasStandingsRows = standingsList.length > 0
  const showScoresButton =
    matchdayNumber != null &&
    matchdayNumber >= 1 &&
    (hasMatchRows || hasStandingsRows) &&
    Array.isArray(managers) &&
    managers.length > 0

  if (!hasBonus && !showScoresButton) return null

  const paper = variant === "newspaper"
  const onDarkSurround = paper || variant === "dashboard"

  return (
    <div className={cn("space-y-4", hasBonus && !paper && "border-t border-border/60 pt-5")}>
      {hasBonus ? (
        <>
          <h3
            className={cn(
              "text-xs font-bold uppercase tracking-wide",
              paper
                ? "section-label border-l-4 pl-3 font-extrabold"
                : "text-[rgba(61,220,132,1)]"
            )}
            style={paper ? { borderColor: "#3ddc84" } : undefined}
          >
            {bonusHighlight!.title}
          </h3>
          <div className="flex flex-col gap-2">
            {bonusHighlight!.entries.map((e, idx) => {
              const verdict = verdictFromHighlightEntry(e.narrative, e.bonusTypeLabel)
              const pill = verdictPillClass[verdict]
              const verdictWord = verdictLabelText[verdict]

              return (
                <div
                  key={`${e.coachName}-${e.bonusTypeLabel}-${idx}`}
                  className="flex flex-col gap-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 md:flex-row md:items-stretch md:gap-0"
                >
                  {/* Mobile : coach + badges en ligne · md+ : colonne gauche 1/3, coach puis badges empilés */}
                  <div className="flex flex-row flex-wrap items-center gap-2 md:w-1/3 md:flex-col md:items-start md:justify-center md:gap-2 md:pr-4">
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground">{e.coachName}</p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                        pill
                      )}
                    >
                      {e.bonusTypeLabel}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                        pill
                      )}
                    >
                      {verdictWord}
                    </span>
                  </div>

                  <div
                    className="hidden w-px shrink-0 self-stretch bg-[#2a2a2a] md:block"
                    aria-hidden
                  />

                  <div className="h-px w-full shrink-0 bg-[#2a2a2a] md:hidden" aria-hidden />

                  <div className="md:flex md:w-2/3 md:flex-col md:justify-center md:pl-4">
                    <p
                      className={cn(
                        "whitespace-pre-line text-sm italic leading-[1.6]",
                        paper ? "text-muted-foreground" : "text-white"
                      )}
                    >
                      {e.narrative}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {showScoresButton ? (
        <>
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "w-full sm:w-auto",
                onDarkSurround &&
                  "border-white/25 bg-zinc-900/50 text-zinc-100 hover:border-white/35 hover:bg-zinc-800/70 hover:text-white"
              )}
              onClick={() => setScoresOpen(true)}
            >
              Scores et classement — J{matchdayNumber}
            </Button>
          </div>
          <MatchdayScoresDialog
            open={scoresOpen}
            onOpenChange={setScoresOpen}
            matchdayNumber={matchdayNumber!}
            matches={matchList}
            standingsAfterMatchday={standingsList}
            managers={managers!}
          />
        </>
      ) : null}
    </div>
  )
}
