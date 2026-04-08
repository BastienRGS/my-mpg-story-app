"use server"

import { revalidatePath } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { getCurrentSeason, getLeagueBySlug } from "@/lib/queries"
import { createServiceRoleClient } from "@/lib/supabase/admin"

export type MatchEntryActionState = {
  ok: boolean
  message: string
  leagueSlug?: string
}

const MAX_BULK_ROWS = 40

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

async function ensureMatchdayId(
  supabase: SupabaseClient,
  seasonId: string,
  number: number
): Promise<{ id: string } | { error: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("matchdays")
    .select("id")
    .eq("season_id", seasonId)
    .eq("number", number)
    .maybeSingle()

  if (selErr) {
    return { error: `Lecture des journées impossible : ${selErr.message}` }
  }
  if (existing?.id) {
    return { id: existing.id }
  }

  const { data: inserted, error: insErr } = await supabase
    .from("matchdays")
    .insert({
      season_id: seasonId,
      number,
      title: null,
      status: null,
    })
    .select("id")
    .single()

  if (!insErr && inserted?.id) {
    return { id: inserted.id }
  }

  const dup =
    insErr?.code === "23505" ||
    (typeof insErr?.message === "string" && /duplicate|unique/i.test(insErr.message))

  if (dup) {
    const { data: again, error: againErr } = await supabase
      .from("matchdays")
      .select("id")
      .eq("season_id", seasonId)
      .eq("number", number)
      .maybeSingle()
    if (againErr) {
      return { error: `Lecture des journées impossible : ${againErr.message}` }
    }
    if (again?.id) {
      return { id: again.id }
    }
  }

  return { error: insErr?.message ?? "Création de la journée impossible." }
}

async function upsertMatch(
  supabase: SupabaseClient,
  matchdayId: string,
  home_team_id: string,
  away_team_id: string,
  home_score: number,
  away_score: number
): Promise<{ error: string } | { ok: true }> {
  const { data: existing, error: findErr } = await supabase
    .from("matches")
    .select("id")
    .eq("matchday_id", matchdayId)
    .eq("home_team_id", home_team_id)
    .eq("away_team_id", away_team_id)
    .maybeSingle()

  if (findErr) {
    return { error: findErr.message }
  }

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from("matches")
      .update({ home_score, away_score })
      .eq("id", existing.id)
    if (upErr) {
      return { error: upErr.message }
    }
    return { ok: true }
  }

  const { error: insErr } = await supabase.from("matches").insert({
    matchday_id: matchdayId,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
  })
  if (insErr) {
    return { error: insErr.message }
  }
  return { ok: true }
}

const bulkMetaSchema = z.object({
  leagueSlug: z.string().min(1, "Ligue requise"),
  matchday_number: z.coerce.number().int().min(1, "Journée ≥ 1"),
  row_count: z.coerce.number().int().min(1).max(MAX_BULK_ROWS),
  adminSecret: z.string().min(1, "Secret admin requis"),
})

const uuid = z.string().uuid()

/**
 * Enregistre plusieurs matchs (service role + secret admin).
 * Crée la ligne `matchdays` si elle n’existe pas pour la saison + numéro.
 * Met à jour le score si un match existe déjà pour la même journée et la même paire d’équipes.
 */
export async function submitBulkMatchResults(
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

  const rawMeta = {
    leagueSlug: String(formData.get("leagueSlug") ?? ""),
    matchday_number: formData.get("matchday_number"),
    row_count: formData.get("row_count"),
    adminSecret,
  }

  const parsedMeta = bulkMetaSchema.safeParse(rawMeta)
  if (!parsedMeta.success) {
    const msg = parsedMeta.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, message: first ?? "Données invalides." }
  }

  const { leagueSlug, matchday_number, row_count } = parsedMeta.data

  const league = await getLeagueBySlug(leagueSlug)
  if (!league) {
    return { ok: false, message: "Ligue introuvable." }
  }

  const season = await getCurrentSeason(league.id)
  if (!season) {
    return { ok: false, message: "Aucune saison courante pour cette ligue." }
  }

  type ParsedRow =
    | { skip: true }
    | {
        skip: false
        home_team_id: string
        away_team_id: string
        home_score: number
        away_score: number
        lineIndex: number
      }

  const rows: ParsedRow[] = []

  for (let i = 0; i < row_count; i++) {
    const homeRaw = String(formData.get(`home_team_id_${i}`) ?? "").trim()
    const awayRaw = String(formData.get(`away_team_id_${i}`) ?? "").trim()
    const hsRaw = String(formData.get(`home_score_${i}`) ?? "").trim()
    const asRaw = String(formData.get(`away_score_${i}`) ?? "").trim()

    const hsEmpty = hsRaw === ""
    const asEmpty = asRaw === ""

    if (hsEmpty && asEmpty) {
      rows.push({ skip: true })
      continue
    }

    if (hsEmpty !== asEmpty) {
      return {
        ok: false,
        message: `Ligne ${i + 1} : renseignez les deux scores ou laissez la ligne entièrement vide.`,
      }
    }

    const homeParsed = uuid.safeParse(homeRaw)
    const awayParsed = uuid.safeParse(awayRaw)
    if (!homeParsed.success || !awayParsed.success) {
      return {
        ok: false,
        message: `Ligne ${i + 1} : choisissez les deux équipes pour enregistrer les scores.`,
      }
    }

    const home_team_id = homeParsed.data
    const away_team_id = awayParsed.data

    if (home_team_id === away_team_id) {
      return {
        ok: false,
        message: `Ligne ${i + 1} : domicile et extérieur doivent être deux équipes différentes.`,
      }
    }

    const homeNum = Number(hsRaw)
    const awayNum = Number(asRaw)
    if (!Number.isInteger(homeNum) || homeNum < 0 || !Number.isInteger(awayNum) || awayNum < 0) {
      return {
        ok: false,
        message: `Ligne ${i + 1} : scores entiers ≥ 0 requis.`,
      }
    }

    rows.push({
      skip: false,
      home_team_id,
      away_team_id,
      home_score: homeNum,
      away_score: awayNum,
      lineIndex: i + 1,
    })
  }

  const toSave = rows.filter((r): r is Exclude<ParsedRow, { skip: true }> => !r.skip)
  if (toSave.length === 0) {
    return {
      ok: false,
      message: "Aucun match à enregistrer (toutes les lignes sont vides ou sans scores complets).",
    }
  }

  const teamIds = new Set<string>()
  for (const r of toSave) {
    teamIds.add(r.home_team_id)
    teamIds.add(r.away_team_id)
  }

  const { data: teams, error: teamErr } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", season.id)
    .in("id", [...teamIds])

  if (teamErr) {
    return { ok: false, message: `Vérification des équipes impossible : ${teamErr.message}` }
  }
  const okIds = new Set((teams ?? []).map((t) => t.id))
  for (const r of toSave) {
    if (!okIds.has(r.home_team_id) || !okIds.has(r.away_team_id)) {
      return {
        ok: false,
        message: `Ligne ${r.lineIndex} : une ou deux équipes n’appartiennent pas à la saison de cette ligue.`,
      }
    }
  }

  const md = await ensureMatchdayId(supabase, season.id, matchday_number)
  if ("error" in md) {
    return { ok: false, message: md.error }
  }

  for (const r of toSave) {
    const res = await upsertMatch(
      supabase,
      md.id,
      r.home_team_id,
      r.away_team_id,
      r.home_score,
      r.away_score
    )
    if ("error" in res) {
      return {
        ok: false,
        message: `Ligne ${r.lineIndex} : ${res.error}`,
      }
    }
  }

  revalidatePath(`/ligue/${leagueSlug}`)
  revalidatePath("/admin/match-results")

  const n = toSave.length
  const label = n === 1 ? "match enregistré" : "matchs enregistrés"
  return {
    ok: true,
    message: `${n} ${label} avec succès.`,
    leagueSlug,
  }
}
