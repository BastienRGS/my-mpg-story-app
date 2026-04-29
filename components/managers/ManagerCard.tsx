import type { ManagerCard as ManagerCardData } from "@/lib/types"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const EMPTY_PALMARES_PHRASES = [
  "Palmarès vierge. Pour l'instant.",
  "Toujours en quête du premier titre.",
  "L'histoire reste à écrire.",
  "Zéro trophée. La honte.",
  "Aucun titre. Mais l'espoir est là.",
] as const

function pickEmptyPalmarèsPhrase(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return EMPTY_PALMARES_PHRASES[h % EMPTY_PALMARES_PHRASES.length]
}

function formatStat(n: number | null): string {
  if (n == null) return "–"
  return String(n)
}

function FormDots({ form }: { form: string | null }) {
  if (!form || form.length === 0) return null
  return (
    <div className="ml-auto flex items-center gap-0.5" aria-label="Forme sur les 5 derniers matchs" role="img">
      {form.split("").map((ch, i) => {
        const color =
          ch === "W"
            ? "bg-emerald-500"
            : ch === "D"
              ? "bg-amber-400"
              : ch === "L"
                ? "bg-red-500"
                : "bg-muted-foreground/30"
        return <span key={i} className={cn("size-1.5 rounded-full", color)} title={ch} />
      })}
    </div>
  )
}

export function ManagerCard({ data }: { data: ManagerCardData }) {
  const { id, teamName, currentLeague, rank, points, goalsFor, goalsAgainst, matchesPlayed, form, palmares, loreTag, loreDescription } =
    data

  const hasTitles = palmares.l1Titles > 0 || palmares.l2Titles > 0
  const showTrophyRow = hasTitles
  const showEmptyPalmarèsPhrase = !hasTitles

  const fullLore = loreDescription ?? ""

  return (
    <Card className="flex h-full min-h-0 w-full min-w-[160px] flex-col gap-0 py-4 shadow-sm">
      <CardHeader className="shrink-0 space-y-2 px-4 pb-2 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold leading-tight text-foreground">{teamName}</p>
          </div>
          <Badge
            className={cn(
              "shrink-0 border font-bold",
              currentLeague === "L1"
                ? "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "border-border/80 bg-muted text-muted-foreground"
            )}
          >
            {currentLeague}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        <div className="shrink-0 flex flex-wrap items-end gap-2">
          <span
            className={cn(
              "text-3xl font-black tabular-nums leading-none",
              rank === 1 ? "text-amber-500 dark:text-amber-400" : rank == null ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {rank ?? "–"}
          </span>
          <span className="text-sm text-muted-foreground">{points != null ? `${points} pts` : "–"}</span>
          <FormDots form={form} />
        </div>

        <Separator className="shrink-0" />

        <div className="grid shrink-0 grid-cols-3 gap-1 text-center">
          <div className="min-w-0 px-0.5">
            <div className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Marqués
            </div>
            <div className="hidden text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:block">
              Buts marqués
            </div>
            <div className="text-sm font-semibold tabular-nums text-foreground">{formatStat(goalsFor)}</div>
          </div>
          <div className="min-w-0 px-0.5">
            <div className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Encaissés
            </div>
            <div className="hidden text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:block">
              Buts encaissés
            </div>
            <div className="text-sm font-semibold tabular-nums text-foreground">{formatStat(goalsAgainst)}</div>
          </div>
          <div className="min-w-0 px-0.5">
            <div className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
              Matchs
            </div>
            <div className="hidden text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:block">
              Matchs joués
            </div>
            <div className="text-sm font-semibold tabular-nums text-foreground">{formatStat(matchesPlayed)}</div>
          </div>
        </div>

        <Separator className="shrink-0" />

        <div className="flex min-h-[3.25rem] shrink-0 flex-col justify-center">
          {showTrophyRow ? (
            <div
              className="flex flex-wrap items-end justify-center gap-x-5 gap-y-2"
              role="list"
              aria-label="Titres de ligue"
            >
              {palmares.l1Titles > 0 ? (
                <span
                  className="inline-flex flex-col items-center gap-1"
                  title={`${palmares.l1Titles} titre${palmares.l1Titles > 1 ? "s" : ""} en Ligue 1`}
                  role="listitem"
                >
                  <span className="inline-flex items-center gap-1.5 leading-6">
                    <Trophy
                      className="size-6 shrink-0 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.45)] dark:text-amber-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="font-semibold tabular-nums leading-6 text-amber-700 dark:text-amber-400">
                      ×{palmares.l1Titles}
                    </span>
                  </span>
                  <span className="text-center text-[0.65rem] font-medium leading-none tracking-wide text-muted-foreground">
                    Ligue 1
                  </span>
                </span>
              ) : null}
              {palmares.l2Titles > 0 ? (
                <span
                  className="inline-flex flex-col items-center gap-1"
                  title={`${palmares.l2Titles} titre${palmares.l2Titles > 1 ? "s" : ""} en Ligue 2`}
                  role="listitem"
                >
                  <span className="inline-flex items-center gap-1.5 leading-6">
                    <Trophy
                      className="size-6 shrink-0 text-zinc-400 dark:text-zinc-300"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="font-semibold tabular-nums leading-6 text-zinc-600 dark:text-zinc-400">
                      ×{palmares.l2Titles}
                    </span>
                  </span>
                  <span className="text-center text-[0.65rem] font-medium leading-none tracking-wide text-muted-foreground">
                    Ligue 2
                  </span>
                </span>
              ) : null}
            </div>
          ) : showEmptyPalmarèsPhrase ? (
            <p className="text-center text-xs italic leading-snug text-muted-foreground">
              {pickEmptyPalmarèsPhrase(id)}
            </p>
          ) : null}
        </div>

        <Separator className="shrink-0" />

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-2">
          {loreTag ? (
            <Badge variant="secondary" className="w-fit text-xs font-medium">
              {loreTag}
            </Badge>
          ) : null}
          <p
            className="line-clamp-2 text-xs italic leading-relaxed text-muted-foreground"
            title={fullLore || undefined}
          >
            {loreDescription ?? "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
