"use server"

import { revalidatePath } from "next/cache"
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
): Promise<{ error: string } | { ok: true; matchId: string }> {
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
    return { ok: true, matchId: existing.id }
  }

  const { data: inserted, error: insErr } = await supabase
    .from("matches")
    .insert({
      matchday_id: matchdayId,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
    })
    .select("id")
    .single()

  if (insErr || !inserted?.id) {
    return { error: insErr?.message ?? "Création du match impossible." }
  }
  return { ok: true, matchId: inserted.id }
}

const STANDARD_BONUS_OUTCOMES = new Set(["win", "loss_or_draw"])
const MIROIR_OUTCOMES = new Set(["mirror_wasted", "mirror_genius", "mirror_draw"])
const VALISE_OUTCOMES = new Set(["valise_decisive", "valise_win_anyway", "no_goal_but_win", "no_goal_to_cancel"])

function isValidBonusOutcome(bonusType: string, outcome: string): boolean {
  const t = bonusType.toLowerCase()
  const o = outcome.toLowerCase()
  if (t === "miroir") return MIROIR_OUTCOMES.has(o)
  if (t === "valise_nanard") return VALISE_OUTCOMES.has(o)
  return STANDARD_BONUS_OUTCOMES.has(o)
}

async function syncMatchBonusesDual(
  supabase: SupabaseClient,
  matchId: string,
  home_team_id: string,
  away_team_id: string,
  seasonId: string,
  homeBonusTypeRaw: string,
  homeBonusOutcomeRaw: string,
  awayBonusTypeRaw: string,
  awayBonusOutcomeRaw: string,
  homeHighlight: boolean,
  awayHighlight: boolean
): Promise<{ error: string } | { ok: true }> {
  const { error: delErr } = await supabase.from("match_bonuses").delete().eq("match_id", matchId)
  if (delErr) return { error: delErr.message }

  const homeT = homeBonusTypeRaw.trim().toLowerCase()
  const awayT = awayBonusTypeRaw.trim().toLowerCase()

  type Ins = { manager_id: string; bonus_type: string; bonus_outcome: string; highlight: boolean }
  const toInsert: Ins[] = []

  if (homeT) {
    const ho = homeBonusOutcomeRaw.trim().toLowerCase()
    if (!ho) {
      return {
        error:
          "Bonus domicile : choisissez un résultat pour le type de bonus sélectionné, ou repassez le type sur « Aucun ».",
      }
    }
    if (!isValidBonusOutcome(homeT, ho)) {
      return { error: "Bonus domicile : combinaison type / résultat invalide." }
    }
    const { data: homeRow, error: hErr } = await supabase
      .from("teams")
      .select("manager_id")
      .eq("id", home_team_id)
      .eq("season_id", seasonId)
      .maybeSingle()
    if (hErr) return { error: hErr.message }
    if (!homeRow?.manager_id) {
      return { error: "Impossible de résoudre l’entraîneur pour l’équipe domicile." }
    }
    toInsert.push({
      manager_id: homeRow.manager_id,
      bonus_type: homeT,
      bonus_outcome: ho,
      highlight: homeHighlight,
    })
  }

  if (awayT) {
    const ao = awayBonusOutcomeRaw.trim().toLowerCase()
    if (!ao) {
      return {
        error:
          "Bonus extérieur : choisissez un résultat pour le type de bonus sélectionné, ou repassez le type sur « Aucun ».",
      }
    }
    if (!isValidBonusOutcome(awayT, ao)) {
      return { error: "Bonus extérieur : combinaison type / résultat invalide." }
    }
    const { data: awayRow, error: aErr } = await supabase
      .from("teams")
      .select("manager_id")
      .eq("id", away_team_id)
      .eq("season_id", seasonId)
      .maybeSingle()
    if (aErr) return { error: aErr.message }
    if (!awayRow?.manager_id) {
      return { error: "Impossible de résoudre l’entraîneur pour l’équipe extérieur." }
    }
    toInsert.push({
      manager_id: awayRow.manager_id,
      bonus_type: awayT,
      bonus_outcome: ao,
      highlight: awayHighlight,
    })
  }

  if (toInsert.length === 0) return { ok: true }

  const { error: insErr } = await supabase.from("match_bonuses").insert(
    toInsert.map((row) => ({
      match_id: matchId,
      manager_id: row.manager_id,
      bonus_type: row.bonus_type,
      bonus_outcome: row.bonus_outcome,
      highlight: row.highlight,
    }))
  )
  if (insErr) return { error: insErr.message }
  return { ok: true }
}

const bulkMetaSchema = z.object({
  leagueSlug: z.string().min(1, "Ligue requise"),
  matchday_number: z.coerce.number().int().min(1, "Journée ≥ 1"),
  row_count: z.coerce.number().int().min(1).max(MAX_BULK_ROWS),
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
  }

  const parsedMeta = bulkMetaSchema.safeParse(rawMeta)
  if (!parsedMeta.success) {
    const msg = parsedMeta.error.flatten().fieldErrors
    const first = Object.values(msg).flat()[0]
    return { ok: false, message: first ?? "Données invalides." }
  }

  const { leagueSlug, matchday_number, row_count } = parsedMeta.data

  const seasonIdFromForm = String(formData.get("seasonId") ?? "").trim()

  const league = await getLeagueBySlug(leagueSlug)
  if (!league) {
    return { ok: false, message: "Ligue introuvable." }
  }

  const season = await getCurrentSeason(league.id)
  if (!season) {
    return { ok: false, message: "Aucune saison courante pour cette ligue." }
  }

  if (seasonIdFromForm && seasonIdFromForm !== season.id) {
    return {
      ok: false,
      message: "La saison active a changé : rechargez la page puis réessayez.",
    }
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

    const i = r.lineIndex - 1
    const homeBonusType = String(formData.get(`home_bonus_type_${i}`) ?? "").trim()
    const homeBonusOutcome = String(formData.get(`home_bonus_outcome_${i}`) ?? "").trim()
    const awayBonusType = String(formData.get(`away_bonus_type_${i}`) ?? "").trim()
    const awayBonusOutcome = String(formData.get(`away_bonus_outcome_${i}`) ?? "").trim()
    const homeHighlight = String(formData.get(`home_bonus_highlight_${i}`) ?? "") === "on"
    const awayHighlight = String(formData.get(`away_bonus_highlight_${i}`) ?? "") === "on"

    const bonusSync = await syncMatchBonusesDual(
      supabase,
      res.matchId,
      r.home_team_id,
      r.away_team_id,
      season.id,
      homeBonusType,
      homeBonusOutcome,
      awayBonusType,
      awayBonusOutcome,
      homeHighlight,
      awayHighlight
    )
    if ("error" in bonusSync) {
      return {
        ok: false,
        message: `Ligne ${r.lineIndex} : ${bonusSync.error}`,
      }
    }
  }

  revalidatePath(`/ligue/${leagueSlug}`)
  revalidatePath(`/ligue/${leagueSlug}/j/${matchday_number}`)
  revalidatePath("/admin/match-results")

  const n = toSave.length
  const label = n === 1 ? "match enregistré" : "matchs enregistrés"
  return {
    ok: true,
    message: `${n} ${label} avec succès.`,
    leagueSlug,
  }
}
