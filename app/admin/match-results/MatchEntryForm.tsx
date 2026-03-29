"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitMatchResult, type MatchEntryActionState } from "./actions"

export type LeagueOption = {
  slug: string
  name: string
  teams: { id: string; label: string }[]
}

const initialState: MatchEntryActionState = { ok: false, message: "" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Enregistrement…" : "Enregistrer le match"}
    </Button>
  )
}

interface MatchEntryFormProps {
  leagueOptions: LeagueOption[]
  defaultLeagueSlug: string
}

export function MatchEntryForm({ leagueOptions, defaultLeagueSlug }: MatchEntryFormProps) {
  const [state, formAction] = useActionState(submitMatchResult, initialState)
  const [leagueSlug, setLeagueSlug] = useState(defaultLeagueSlug)

  const teams = useMemo(() => {
    return leagueOptions.find((l) => l.slug === leagueSlug)?.teams ?? []
  }, [leagueOptions, leagueSlug])

  const [homeId, setHomeId] = useState("")
  const [awayId, setAwayId] = useState("")

  useEffect(() => {
    setHomeId("")
    setAwayId("")
  }, [leagueSlug])

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6">
      <input type="hidden" name="leagueSlug" value={leagueSlug} />

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

      <div className="space-y-2">
        <Label htmlFor="leagueSelect">Ligue</Label>
        <select
          id="leagueSelect"
          value={leagueSlug}
          onChange={(e) => setLeagueSlug(e.target.value)}
          required
          className="border-input flex h-9 w-full max-w-md rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {leagueOptions.map((l) => (
            <option key={l.slug} value={l.slug} disabled={l.teams.length < 2}>
              {l.name}
              {l.teams.length < 2 ? " (équipes insuffisantes)" : ""}
            </option>
          ))}
        </select>
      </div>

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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="home_team_id">Équipe domicile</Label>
          <select
            id="home_team_id"
            name="home_team_id"
            value={homeId}
            onChange={(e) => setHomeId(e.target.value)}
            required
            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">— Choisir —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="away_team_id">Équipe extérieur</Label>
          <select
            id="away_team_id"
            name="away_team_id"
            value={awayId}
            onChange={(e) => setAwayId(e.target.value)}
            required
            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">— Choisir —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="home_score">Buts domicile</Label>
          <Input id="home_score" name="home_score" type="number" min={0} required className="max-w-[8rem]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="away_score">Buts extérieur</Label>
          <Input id="away_score" name="away_score" type="number" min={0} required className="max-w-[8rem]" />
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

      <SubmitButton />
    </form>
  )
}
