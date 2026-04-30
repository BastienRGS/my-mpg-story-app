"use client"

import { useActionState, useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitBulkMatchResults, type MatchEntryActionState } from "./actions"

export type LeagueOption = {
  slug: string
  name: string
  /** Saison `is_current` pour cette ligue (alignée avec les actions serveur). */
  seasonId: string | null
  teams: { id: string; label: string }[]
}

const DEFAULT_ROWS = 6
const MAX_ROWS = 40

const initialState: MatchEntryActionState = { ok: false, message: "" }

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto">
      {pending ? "Enregistrement…" : "Enregistrer tous les matchs"}
    </Button>
  )
}

interface MatchEntryFormProps {
  leagueOptions: LeagueOption[]
  /** Contrôlé par le sélecteur de ligue (onglets) au-dessus du formulaire. */
  leagueSlug: string
}

function teamsUsedInOtherRows(
  rowIdx: number,
  homes: readonly string[],
  aways: readonly string[]
): Set<string> {
  const used = new Set<string>()
  for (let j = 0; j < homes.length; j++) {
    if (j === rowIdx) continue
    const h = homes[j]?.trim()
    const a = aways[j]?.trim()
    if (h) used.add(h)
    if (a) used.add(a)
  }
  return used
}

export function MatchEntryForm({ leagueOptions, leagueSlug }: MatchEntryFormProps) {
  const [state, formAction] = useActionState(submitBulkMatchResults, initialState)
  const [numRows, setNumRows] = useState(DEFAULT_ROWS)
  const [homeSelections, setHomeSelections] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))
  const [awaySelections, setAwaySelections] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))

  const activeLeague = useMemo(
    () => leagueOptions.find((l) => l.slug === leagueSlug),
    [leagueOptions, leagueSlug]
  )
  const teams = activeLeague?.teams ?? []
  const seasonId = activeLeague?.seasonId ?? ""
  const canSubmit = teams.length >= 2 && Boolean(seasonId)

  useEffect(() => {
    setNumRows(DEFAULT_ROWS)
    setHomeSelections(Array(DEFAULT_ROWS).fill(""))
    setAwaySelections(Array(DEFAULT_ROWS).fill(""))
  }, [leagueSlug])

  useEffect(() => {
    setHomeSelections((h) => {
      if (numRows > h.length) return [...h, ...Array(numRows - h.length).fill("")]
      return h.slice(0, numRows)
    })
    setAwaySelections((a) => {
      if (numRows > a.length) return [...a, ...Array(numRows - a.length).fill("")]
      return a.slice(0, numRows)
    })
  }, [numRows])

  const rowIndices = useMemo(() => Array.from({ length: numRows }, (_, i) => i), [numRows])

  const prepareSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      const form = e.currentTarget
      for (let i = 0; i < numRows; i++) {
        const homeRaw = String((form.elements.namedItem(`home_team_id_${i}`) as HTMLSelectElement | null)?.value ?? "").trim()
        const awayRaw = String((form.elements.namedItem(`away_team_id_${i}`) as HTMLSelectElement | null)?.value ?? "").trim()
        if (!homeRaw && !awayRaw) {
          const hs = form.elements.namedItem(`home_score_${i}`) as HTMLInputElement | null
          const awayEl = form.elements.namedItem(`away_score_${i}`) as HTMLInputElement | null
          if (hs) hs.value = ""
          if (awayEl) awayEl.value = ""
        }
      }
    },
    [numRows]
  )

  return (
    <form action={formAction} onSubmit={prepareSubmit} className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6">
      <input type="hidden" name="leagueSlug" value={leagueSlug} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="row_count" value={numRows} />

      <div className="space-y-2">
        <Label htmlFor="adminSecret">Secret admin</Label>
        <Input
          id="adminSecret"
          name="adminSecret"
          type="password"
          autoComplete="off"
          placeholder="ADMIN_MATCH_ENTRY_SECRET"
          required
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground">
          Même valeur que <code className="rounded bg-muted px-1">ADMIN_MATCH_ENTRY_SECRET</code> dans
          .env.local — ne la partagez pas.
        </p>
      </div>

      {!canSubmit ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          {teams.length < 2 ? (
            <>
              Au moins <strong className="text-foreground">deux équipes</strong> sont nécessaires pour la
              saison courante de cette ligue. Complétez le roster dans Supabase ou choisissez une autre
              ligue.
            </>
          ) : (
            <>Aucune saison courante (<code className="rounded bg-muted px-1">is_current</code>) pour cette
              ligue — créez ou marquez une saison dans Supabase.</>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="matchday_number">Journée (numéro)</Label>
          <Input
            id="matchday_number"
            name="matchday_number"
            type="number"
            min={1}
            required
            className="max-w-[8rem]"
          />
          <p className="text-xs text-muted-foreground">
            Si la journée n’existe pas encore dans Supabase pour cette saison, elle sera créée
            automatiquement à l’enregistrement.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Matchs de la journée</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={numRows >= MAX_ROWS}
              onClick={() => setNumRows((n) => Math.min(MAX_ROWS, n + 1))}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Ajouter une ligne
            </Button>
          </div>

          <div
            key={leagueSlug}
            className="space-y-4 rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4"
            role="group"
            aria-label="Grille des matchs"
          >
            {/* En-tête desktop */}
            <div className="mb-1 hidden gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_4.5rem_4.5rem_1fr] sm:items-end sm:gap-3">
              <span>Équipe A</span>
              <span className="text-center">Buts A</span>
              <span className="text-center">Buts B</span>
              <span>Équipe B</span>
            </div>

            {rowIndices.map((i) => {
              const usedElsewhere = teamsUsedInOtherRows(i, homeSelections, awaySelections)
              const homeVal = homeSelections[i] ?? ""
              const awayVal = awaySelections[i] ?? ""

              return (
                <div
                  key={`${leagueSlug}-${i}`}
                  className="grid gap-3 rounded-md border border-border/60 bg-card/80 p-3 sm:grid-cols-[1fr_4.5rem_4.5rem_1fr] sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0"
                  aria-label={`Match ligne ${i + 1}`}
                >
                  <div className="space-y-1 sm:space-y-0">
                    <Label htmlFor={`home_team_id_${i}`} className="sm:sr-only">
                      Équipe A (ligne {i + 1})
                    </Label>
                    <select
                      id={`home_team_id_${i}`}
                      name={`home_team_id_${i}`}
                      value={homeVal}
                      onChange={(e) => {
                        const v = e.target.value
                        setHomeSelections((prev) => {
                          const next = [...prev]
                          next[i] = v
                          return next
                        })
                      }}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="">— Équipe A —</option>
                      {teams.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={usedElsewhere.has(t.id) && t.id !== homeVal}
                        >
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <div className="space-y-1 sm:space-y-0">
                      <Label htmlFor={`home_score_${i}`} className="sm:sr-only">
                        Buts A
                      </Label>
                      <Input
                        id={`home_score_${i}`}
                        name={`home_score_${i}`}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        defaultValue={0}
                        className="h-9 w-full sm:max-w-[4.5rem]"
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-0">
                      <Label htmlFor={`away_score_${i}`} className="sm:sr-only">
                        Buts B
                      </Label>
                      <Input
                        id={`away_score_${i}`}
                        name={`away_score_${i}`}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        defaultValue={0}
                        className="h-9 w-full sm:max-w-[4.5rem]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-0">
                    <Label htmlFor={`away_team_id_${i}`} className="sm:sr-only">
                      Équipe B (ligne {i + 1})
                    </Label>
                    <select
                      id={`away_team_id_${i}`}
                      name={`away_team_id_${i}`}
                      value={awayVal}
                      onChange={(e) => {
                        const v = e.target.value
                        setAwaySelections((prev) => {
                          const next = [...prev]
                          next[i] = v
                          return next
                        })
                      }}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="">— Équipe B —</option>
                      {teams.map((t) => (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={usedElsewhere.has(t.id) && t.id !== awayVal}
                        >
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Les lignes sans score (champs vides) sont ignorées. Un match déjà présent pour cette journée et
            la même paire d’équipes est mis à jour.
          </p>
        </div>
      </div>

      {state.message ? (
        <p
          className={`text-sm ${state.ok ? "text-primary" : "text-destructive"}`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}

      {state.ok && state.leagueSlug ? (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/ligue/${state.leagueSlug}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Ouvrir le tableau de bord de la ligue
          </Link>
        </p>
      ) : null}

      <SubmitButton disabled={!canSubmit} />
    </form>
  )
}
