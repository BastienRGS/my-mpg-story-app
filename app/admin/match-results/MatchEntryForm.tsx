"use client"

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
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

const BONUS_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Aucun" },
  { value: "zahia", label: "Zahia" },
  { value: "suarez", label: "Suarez" },
  { value: "cheat_code", label: "Cheat Code 18-26" },
  { value: "4decat", label: "4 Decat" },
  { value: "miroir", label: "Miroir" },
  { value: "tonton_pat", label: "Tonton Pat'" },
  { value: "valise_nanard", label: "Valise à Nanard" },
  { value: "mcdo_plus", label: "McDo+" },
  { value: "capitaine", label: "Capitaine" },
]

/** Types dont le résultat est déduit des buts (sauf Miroir = manuel). */
const AUTO_OUTCOME_TYPES = new Set([
  "zahia",
  "suarez",
  "cheat_code",
  "4decat",
  "mcdo_plus",
  "tonton_pat",
  "capitaine",
  "valise_nanard",
])

function isAutoOutcomeBonusType(bonusType: string): boolean {
  return AUTO_OUTCOME_TYPES.has(bonusType.trim().toLowerCase())
}

function computeAutoBonusOutcome(
  side: "home" | "away",
  bonusType: string,
  homeScore: number,
  awayScore: number
): "win" | "loss_or_draw" | "no_goal_to_cancel" {
  const bt = bonusType.trim().toLowerCase()
  const hs = Number.isFinite(homeScore) ? Math.max(0, Math.floor(homeScore)) : 0
  const asco = Number.isFinite(awayScore) ? Math.max(0, Math.floor(awayScore)) : 0

  if (bt === "valise_nanard") {
    if (side === "home") {
      if (asco === 0) return "no_goal_to_cancel"
      if (hs > asco) return "win"
      return "loss_or_draw"
    }
    if (hs === 0) return "no_goal_to_cancel"
    if (asco > hs) return "win"
    return "loss_or_draw"
  }

  if (side === "home") {
    if (hs > asco) return "win"
    return "loss_or_draw"
  }
  if (asco > hs) return "win"
  return "loss_or_draw"
}

function formatDetectedOutcomeLabel(outcome: "win" | "loss_or_draw" | "no_goal_to_cancel"): string {
  if (outcome === "win") return "Résultat détecté automatiquement : Victoire ✓"
  if (outcome === "no_goal_to_cancel") {
    return "Résultat détecté automatiquement : Pas de but adverse à annuler (valise pour rien) ✓"
  }
  return "Résultat détecté automatiquement : Défaite ou nul ✓"
}

const selectClassName =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const initialState: MatchEntryActionState = { ok: false, message: "" }

const ADMIN_MATCH_DRAFT_PREFIX = "my-mpg-story:admin-match-draft"

type AdminMatchDraftV1 = {
  v: 1
  leagueSlug: string
  seasonId: string
  matchdayNumber: string
  numRows: number
  homeSelections: string[]
  awaySelections: string[]
  homeScores: number[]
  awayScores: number[]
  homeBonusTypeSelections: string[]
  awayBonusTypeSelections: string[]
  homeMirrorOutcomes: string[]
  awayMirrorOutcomes: string[]
  homeBonusHighlights: boolean[]
  awayBonusHighlights: boolean[]
}

function draftStorageKey(leagueSlug: string, seasonId: string) {
  return `${ADMIN_MATCH_DRAFT_PREFIX}:${leagueSlug}:${seasonId}`
}

function padRowArray<T>(arr: unknown[], len: number, fill: T): T[] {
  const out: T[] = []
  for (let i = 0; i < len; i++) {
    const v = arr[i]
    out.push(v !== undefined && v !== null ? (v as T) : fill)
  }
  return out
}

function clampIntScore(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function isAdminMatchDraftV1(x: unknown): x is AdminMatchDraftV1 {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  if (o.v !== 1) return false
  if (typeof o.leagueSlug !== "string" || typeof o.seasonId !== "string") return false
  if (typeof o.matchdayNumber !== "string") return false
  if (typeof o.numRows !== "number" || !Number.isInteger(o.numRows) || o.numRows < 1 || o.numRows > MAX_ROWS) {
    return false
  }
  const strArr = (a: unknown) => Array.isArray(a) && a.every((i) => typeof i === "string")
  const numArr = (a: unknown) => Array.isArray(a) && a.every((i) => typeof i === "number" && Number.isFinite(i))
  const boolArr = (a: unknown) => Array.isArray(a) && a.every((i) => typeof i === "boolean")
  if (!strArr(o.homeSelections) || !strArr(o.awaySelections)) return false
  if (!numArr(o.homeScores) || !numArr(o.awayScores)) return false
  if (!strArr(o.homeBonusTypeSelections) || !strArr(o.awayBonusTypeSelections)) return false
  if (!strArr(o.homeMirrorOutcomes) || !strArr(o.awayMirrorOutcomes)) return false
  if (!boolArr(o.homeBonusHighlights) || !boolArr(o.awayBonusHighlights)) return false
  return true
}

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

function bonusRowTitle(side: "home" | "away", teamId: string, teams: { id: string; label: string }[]): string {
  if (!teamId.trim()) {
    return side === "home" ? "Bonus Équipe A" : "Bonus Équipe B"
  }
  const label = teams.find((t) => t.id === teamId)?.label?.trim()
  return label ? `Bonus ${label}` : side === "home" ? "Bonus Équipe A" : "Bonus Équipe B"
}

function MirrorOutcomeSelect({
  prefix,
  rowIndex,
  value,
  onChange,
}: {
  prefix: "home" | "away"
  rowIndex: number
  value: string
  onChange: (value: string) => void
}) {
  const name = `${prefix}_bonus_outcome_${rowIndex}`
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="text-sm text-muted-foreground sm:mt-2 sm:w-32 sm:shrink-0">Résultat</span>
      <select
        id={name}
        name={name}
        className={`${selectClassName} sm:flex-1`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Choisir —</option>
        <option value="mirror_wasted">Miroir inutile</option>
        <option value="mirror_genius">Miroir génie</option>
        <option value="mirror_draw">Miroir nul</option>
      </select>
    </div>
  )
}

function BonusOutcomeBlock({
  prefix,
  rowIndex,
  bonusType,
  homeScore,
  awayScore,
  mirrorOutcome,
  onMirrorOutcomeChange,
}: {
  prefix: "home" | "away"
  rowIndex: number
  bonusType: string
  homeScore: number
  awayScore: number
  mirrorOutcome: string
  onMirrorOutcomeChange: (value: string) => void
}) {
  const name = `${prefix}_bonus_outcome_${rowIndex}`
  const bt = bonusType.trim().toLowerCase()

  if (bt === "miroir") {
    return (
      <div className="border-l-2 border-muted/80 pl-3 sm:ml-[calc(8rem+0.75rem)]">
        <MirrorOutcomeSelect
          prefix={prefix}
          rowIndex={rowIndex}
          value={mirrorOutcome}
          onChange={onMirrorOutcomeChange}
        />
      </div>
    )
  }

  if (isAutoOutcomeBonusType(bt)) {
    const outcome = computeAutoBonusOutcome(prefix, bt, homeScore, awayScore)
    return (
      <div className="border-l-2 border-muted/80 pl-3 sm:ml-[calc(8rem+0.75rem)]">
        <input type="hidden" name={name} value={outcome} />
        <p className="text-xs italic text-muted-foreground">{formatDetectedOutcomeLabel(outcome)}</p>
      </div>
    )
  }

  return null
}

export function MatchEntryForm({ leagueOptions, leagueSlug }: MatchEntryFormProps) {
  const [state, formAction] = useActionState(submitBulkMatchResults, initialState)
  const [matchdayNumber, setMatchdayNumber] = useState("")
  const [numRows, setNumRows] = useState(DEFAULT_ROWS)
  const [homeSelections, setHomeSelections] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))
  const [awaySelections, setAwaySelections] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))
  const [homeScores, setHomeScores] = useState<number[]>(() => Array(DEFAULT_ROWS).fill(0))
  const [awayScores, setAwayScores] = useState<number[]>(() => Array(DEFAULT_ROWS).fill(0))
  const [homeBonusTypeSelections, setHomeBonusTypeSelections] = useState<string[]>(() =>
    Array(DEFAULT_ROWS).fill("")
  )
  const [awayBonusTypeSelections, setAwayBonusTypeSelections] = useState<string[]>(() =>
    Array(DEFAULT_ROWS).fill("")
  )
  const [homeMirrorOutcomes, setHomeMirrorOutcomes] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))
  const [awayMirrorOutcomes, setAwayMirrorOutcomes] = useState<string[]>(() => Array(DEFAULT_ROWS).fill(""))
  const [homeBonusHighlights, setHomeBonusHighlights] = useState<boolean[]>(() =>
    Array(DEFAULT_ROWS).fill(false)
  )
  const [awayBonusHighlights, setAwayBonusHighlights] = useState<boolean[]>(() =>
    Array(DEFAULT_ROWS).fill(false)
  )

  const activeLeague = useMemo(
    () => leagueOptions.find((l) => l.slug === leagueSlug),
    [leagueOptions, leagueSlug]
  )
  const teams = activeLeague?.teams ?? []
  const seasonId = activeLeague?.seasonId ?? ""
  const canSubmit = teams.length >= 2 && Boolean(seasonId)

  const applyEmptyGrid = useCallback((rows: number) => {
    const n = Math.min(MAX_ROWS, Math.max(1, rows))
    setNumRows(n)
    setHomeSelections(Array(n).fill(""))
    setAwaySelections(Array(n).fill(""))
    setHomeScores(Array(n).fill(0))
    setAwayScores(Array(n).fill(0))
    setHomeBonusTypeSelections(Array(n).fill(""))
    setAwayBonusTypeSelections(Array(n).fill(""))
    setHomeMirrorOutcomes(Array(n).fill(""))
    setAwayMirrorOutcomes(Array(n).fill(""))
    setHomeBonusHighlights(Array(n).fill(false))
    setAwayBonusHighlights(Array(n).fill(false))
  }, [])

  useEffect(() => {
    const defaults = () => {
      setMatchdayNumber("")
      applyEmptyGrid(DEFAULT_ROWS)
    }
    if (!seasonId) {
      defaults()
      return
    }
    let parsed: unknown
    try {
      const raw = localStorage.getItem(draftStorageKey(leagueSlug, seasonId))
      if (!raw) {
        defaults()
        return
      }
      parsed = JSON.parse(raw) as unknown
    } catch {
      defaults()
      return
    }
    if (
      !isAdminMatchDraftV1(parsed) ||
      parsed.leagueSlug !== leagueSlug ||
      parsed.seasonId !== seasonId
    ) {
      defaults()
      return
    }
    const n = Math.min(MAX_ROWS, Math.max(1, Math.floor(parsed.numRows)))
    setMatchdayNumber(parsed.matchdayNumber)
    setNumRows(n)
    setHomeSelections(padRowArray(parsed.homeSelections as unknown[], n, "").map(String))
    setAwaySelections(padRowArray(parsed.awaySelections as unknown[], n, "").map(String))
    setHomeScores(padRowArray(parsed.homeScores as unknown[], n, 0).map(clampIntScore))
    setAwayScores(padRowArray(parsed.awayScores as unknown[], n, 0).map(clampIntScore))
    setHomeBonusTypeSelections(padRowArray(parsed.homeBonusTypeSelections as unknown[], n, "").map(String))
    setAwayBonusTypeSelections(padRowArray(parsed.awayBonusTypeSelections as unknown[], n, "").map(String))
    setHomeMirrorOutcomes(padRowArray(parsed.homeMirrorOutcomes as unknown[], n, "").map(String))
    setAwayMirrorOutcomes(padRowArray(parsed.awayMirrorOutcomes as unknown[], n, "").map(String))
    setHomeBonusHighlights(padRowArray(parsed.homeBonusHighlights as unknown[], n, false).map(Boolean))
    setAwayBonusHighlights(padRowArray(parsed.awayBonusHighlights as unknown[], n, false).map(Boolean))
  }, [leagueSlug, seasonId, applyEmptyGrid])

  const saveDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!seasonId) return
    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current)
    saveDraftTimerRef.current = setTimeout(() => {
      try {
        const payload: AdminMatchDraftV1 = {
          v: 1,
          leagueSlug,
          seasonId,
          matchdayNumber,
          numRows,
          homeSelections,
          awaySelections,
          homeScores,
          awayScores,
          homeBonusTypeSelections,
          awayBonusTypeSelections,
          homeMirrorOutcomes,
          awayMirrorOutcomes,
          homeBonusHighlights,
          awayBonusHighlights,
        }
        localStorage.setItem(draftStorageKey(leagueSlug, seasonId), JSON.stringify(payload))
      } catch {
        /* quota ou mode privé */
      }
      saveDraftTimerRef.current = null
    }, 400)
    return () => {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current)
    }
  }, [
    seasonId,
    leagueSlug,
    matchdayNumber,
    numRows,
    homeSelections,
    awaySelections,
    homeScores,
    awayScores,
    homeBonusTypeSelections,
    awayBonusTypeSelections,
    homeMirrorOutcomes,
    awayMirrorOutcomes,
    homeBonusHighlights,
    awayBonusHighlights,
  ])

  const successCleanupDone = useRef(false)
  useEffect(() => {
    if (!state.ok) {
      successCleanupDone.current = false
      return
    }
    if (successCleanupDone.current) return
    successCleanupDone.current = true
    const slugForDraft = state.leagueSlug ?? leagueSlug
    try {
      if (seasonId) localStorage.removeItem(draftStorageKey(slugForDraft, seasonId))
    } catch {
      /* ignore */
    }
    setMatchdayNumber("")
    applyEmptyGrid(DEFAULT_ROWS)
  }, [state.ok, state.leagueSlug, leagueSlug, seasonId, applyEmptyGrid])

  useEffect(() => {
    setHomeSelections((h) => {
      if (numRows > h.length) return [...h, ...Array(numRows - h.length).fill("")]
      return h.slice(0, numRows)
    })
    setAwaySelections((a) => {
      if (numRows > a.length) return [...a, ...Array(numRows - a.length).fill("")]
      return a.slice(0, numRows)
    })
    setHomeScores((s) => {
      if (numRows > s.length) return [...s, ...Array(numRows - s.length).fill(0)]
      return s.slice(0, numRows)
    })
    setAwayScores((s) => {
      if (numRows > s.length) return [...s, ...Array(numRows - s.length).fill(0)]
      return s.slice(0, numRows)
    })
    setHomeBonusTypeSelections((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill("")]
      return b.slice(0, numRows)
    })
    setAwayBonusTypeSelections((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill("")]
      return b.slice(0, numRows)
    })
    setHomeMirrorOutcomes((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill("")]
      return b.slice(0, numRows)
    })
    setAwayMirrorOutcomes((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill("")]
      return b.slice(0, numRows)
    })
    setHomeBonusHighlights((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill(false)]
      return b.slice(0, numRows)
    })
    setAwayBonusHighlights((b) => {
      if (numRows > b.length) return [...b, ...Array(numRows - b.length).fill(false)]
      return b.slice(0, numRows)
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
        const homeBt = String((form.elements.namedItem(`home_bonus_type_${i}`) as HTMLSelectElement | null)?.value ?? "").trim()
        if (!homeBt) {
          const bo = form.elements.namedItem(`home_bonus_outcome_${i}`) as HTMLInputElement | null
          if (bo) bo.value = ""
        }
        const awayBt = String((form.elements.namedItem(`away_bonus_type_${i}`) as HTMLSelectElement | null)?.value ?? "").trim()
        if (!awayBt) {
          const bo = form.elements.namedItem(`away_bonus_outcome_${i}`) as HTMLInputElement | null
          if (bo) bo.value = ""
        }
      }
    },
    [numRows]
  )

  const parseScore = (v: string): number => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

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
          .env.local — ne la partagez pas. Le secret n’est pas mémorisé ; le reste du formulaire est
          sauvegardé automatiquement dans ce navigateur (rechargement ou mauvais code inclus).
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
            value={matchdayNumber}
            onChange={(e) => setMatchdayNumber(e.target.value)}
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
              const hs = homeScores[i] ?? 0
              const asco = awayScores[i] ?? 0
              const homeBt = homeBonusTypeSelections[i] ?? ""
              const awayBt = awayBonusTypeSelections[i] ?? ""

              return (
                <div
                  key={`${leagueSlug}-${i}`}
                  className="space-y-4 rounded-md border border-border/60 bg-card/80 p-3"
                  aria-label={`Match ligne ${i + 1}`}
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_4.5rem_4.5rem_1fr] sm:items-center sm:gap-3">
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
                          value={!homeVal && !awayVal ? "" : String(hs)}
                          onChange={(e) => {
                            const raw = e.target.value
                            const v = raw === "" ? 0 : parseScore(raw)
                            setHomeScores((prev) => {
                              const next = [...prev]
                              next[i] = v
                              return next
                            })
                          }}
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
                          value={!homeVal && !awayVal ? "" : String(asco)}
                          onChange={(e) => {
                            const raw = e.target.value
                            const v = raw === "" ? 0 : parseScore(raw)
                            setAwayScores((prev) => {
                              const next = [...prev]
                              next[i] = v
                              return next
                            })
                          }}
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

                  <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm text-muted-foreground sm:w-32 sm:shrink-0">
                          {bonusRowTitle("home", homeVal, teams)}
                        </span>
                        <select
                          id={`home_bonus_type_${i}`}
                          name={`home_bonus_type_${i}`}
                          value={homeBt}
                          onChange={(e) => {
                            const v = e.target.value
                            setHomeBonusTypeSelections((prev) => {
                              const next = [...prev]
                              next[i] = v
                              return next
                            })
                          }}
                          className={`${selectClassName} sm:min-w-0 sm:flex-1`}
                        >
                          {BONUS_TYPE_OPTIONS.map((opt) => (
                            <option key={`h-${i}-${opt.value || "aucun"}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {homeBt ? (
                        <>
                          <BonusOutcomeBlock
                            prefix="home"
                            rowIndex={i}
                            bonusType={homeBt}
                            homeScore={hs}
                            awayScore={asco}
                            mirrorOutcome={homeMirrorOutcomes[i] ?? ""}
                            onMirrorOutcomeChange={(v) => {
                              setHomeMirrorOutcomes((prev) => {
                                const next = [...prev]
                                next[i] = v
                                return next
                              })
                            }}
                          />
                          <label className="flex cursor-pointer items-start gap-2 pt-1 sm:ml-[calc(8rem+0.75rem)]">
                            <input
                              type="checkbox"
                              name={`home_bonus_highlight_${i}`}
                              value="on"
                              checked={homeBonusHighlights[i] ?? false}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setHomeBonusHighlights((prev) => {
                                  const next = [...prev]
                                  next[i] = checked
                                  return next
                                })
                              }}
                              className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
                            />
                            <span className="text-xs text-muted-foreground leading-snug">
                              Mettre ce bonus en avant dans la synthèse
                            </span>
                          </label>
                        </>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm text-muted-foreground sm:w-32 sm:shrink-0">
                          {bonusRowTitle("away", awayVal, teams)}
                        </span>
                        <select
                          id={`away_bonus_type_${i}`}
                          name={`away_bonus_type_${i}`}
                          value={awayBt}
                          onChange={(e) => {
                            const v = e.target.value
                            setAwayBonusTypeSelections((prev) => {
                              const next = [...prev]
                              next[i] = v
                              return next
                            })
                          }}
                          className={`${selectClassName} sm:min-w-0 sm:flex-1`}
                        >
                          {BONUS_TYPE_OPTIONS.map((opt) => (
                            <option key={`a-${i}-${opt.value || "aucun"}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {awayBt ? (
                        <>
                          <BonusOutcomeBlock
                            prefix="away"
                            rowIndex={i}
                            bonusType={awayBt}
                            homeScore={hs}
                            awayScore={asco}
                            mirrorOutcome={awayMirrorOutcomes[i] ?? ""}
                            onMirrorOutcomeChange={(v) => {
                              setAwayMirrorOutcomes((prev) => {
                                const next = [...prev]
                                next[i] = v
                                return next
                              })
                            }}
                          />
                          <label className="flex cursor-pointer items-start gap-2 pt-1 sm:ml-[calc(8rem+0.75rem)]">
                            <input
                              type="checkbox"
                              name={`away_bonus_highlight_${i}`}
                              value="on"
                              checked={awayBonusHighlights[i] ?? false}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setAwayBonusHighlights((prev) => {
                                  const next = [...prev]
                                  next[i] = checked
                                  return next
                                })
                              }}
                              className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
                            />
                            <span className="text-xs text-muted-foreground leading-snug">
                              Mettre ce bonus en avant dans la synthèse
                            </span>
                          </label>
                        </>
                      ) : null}
                    </div>
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
