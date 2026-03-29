"use server"

import { revalidatePath } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { z } from "zod"
import { getCurrentSeason, getLeagueBySlug } from "@/lib/queries"
import { createServiceRoleClient } from "@/lib/supabase/admin"

export type MatchEntryActionState = {
  ok: boolean
  message: string
  leagueSlug?: string
}

function secretsMatch(provided: string, expected: string | undefined): boolean {
  if (!expected || expected.length === 0) return false
  try {
    const a = Buffer.from(provided, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

const formSchema = z.object({
  leagueSlug: z.string().min(1, "Ligue requise"),
  matchday_number: z.coerce.number().int().min(1, "Journée ≥ 1"),
  home_team_id: z.string().uuid("Équipe domicile invalide"),
  away_team_id: z.string().uuid("Équipe extérieur invalide"),
  home_score: z.coerce.number().int().min(0),
  away_score: z.coerce.number().int().min(0),
  adminSecret: z.string().min(1, "Secret admin requis"),
})

/**
 * Insère une ligne dans `matches` (service role + secret admin).
 * Prérequis : voir `docs/WEEKLY_WORKFLOW.md`.
 */
export async function submitMatchResult(
  _prev: MatchEntryActionState,
  formData: FormData
): Promise<MatchEntryActionState> {
  const expectedSecret = process.env.ADMIN_MATCH_ENTRY_SECRET
  if (!expectedSecret) {
    return {
      ok: false,
      message:
        "Formulaire désactivé : définissez ADMIN_MATCH_ENTRY_SECRET dans .env.local (voir docs/WEEKLY_WORKFLOW.md).",
    }
  }

  const adminSecret = String(formData.get("adminSecret") ?? "")
  if (!secretsMatch(adminSecret, expectedSecret)) {
    return { ok: false, message: "Secret admin incorrect." }
  }

  const supabase = createServiceRoleClient()
  if (!supabase) {
    return {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY manquant : impossible d’écrire dans « matches » depuis l’app (voir docs/WEEKLY_WORKFLOW.md).",
    }
  }

  const raw = {
    leagueSlug: String(formData.get("leagueSlug") ?? ""),
    matchday_number: formData.get("matchday_number"),
    home_team_id: String(formData.get("home_team_id") ?? ""),
    away_team_id: String(formData.get("away_team_id") ?? ""),
    home_score: formData.get("home_score"),
    away_score: formData.get("away_score"),
    adminSecret,
  }

  const parsed = formSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, message: first ?? "Données invalides." }
  }

  const { leagueSlug, matchday_number, home_team_id, away_team_id, home_score, away_score } =
    parsed.data

  if (home_team_id === away_team_id) {
    return { ok: false, message: "Domicile et extérieur doivent être deux équipes différentes." }
  }

  const league = await getLeagueBySlug(leagueSlug)
  if (!league) {
    return { ok: false, message: "Ligue introuvable." }
  }

  const season = await getCurrentSeason(league.id)
  if (!season) {
    return { ok: false, message: "Aucune saison courante pour cette ligue." }
  }

  const { data: teams, error: teamErr } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", season.id)
    .in("id", [home_team_id, away_team_id])

  if (teamErr) {
    return { ok: false, message: `Vérification des équipes impossible : ${teamErr.message}` }
  }
  const okIds = new Set((teams ?? []).map((t) => t.id))
  if (!okIds.has(home_team_id) || !okIds.has(away_team_id)) {
    return {
      ok: false,
      message: "Une ou deux équipes n’appartiennent pas à la saison de cette ligue.",
    }
  }

  const { data: matchdayRow, error: mdLookupErr } = await supabase
    .from("matchdays")
    .select("id")
    .eq("season_id", season.id)
    .eq("number", matchday_number)
    .maybeSingle()

  if (mdLookupErr) {
    return { ok: false, message: `Lecture des journées impossible : ${mdLookupErr.message}` }
  }
  if (!matchdayRow?.id) {
    return {
      ok: false,
      message: `Aucune ligne « matchdays » pour la journée ${matchday_number} et cette saison. Créez-la dans Supabase (season_id + number), puis réessayez.`,
    }
  }

  const { error: insertErr } = await supabase.from("matches").insert({
    matchday_id: matchdayRow.id,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
  })

  if (insertErr) {
    return {
      ok: false,
      message: `Insertion refusée : ${insertErr.message}. Vérifiez les doublons (même journée + mêmes équipes).`,
    }
  }

  revalidatePath(`/ligue/${leagueSlug}`)
  revalidatePath("/admin/match-results")

  return {
    ok: true,
    message: `Match enregistré (J${matchday_number}). Rechargez le tableau de bord de la ligue.`,
    leagueSlug,
  }
}
