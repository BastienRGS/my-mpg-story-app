import { getBonusNarrative } from "@/lib/bonus-narrative"
import type { BonusHighlightBlock, BonusNarrativeEntry, ManagerWithTeam } from "@/lib/types"

export type { BonusHighlightBlock }

export type MatchBonusRecord = {
  match_id: string
  manager_id: string
  bonus_type: string
  bonus_outcome: string
  created_at?: string | null
  highlight?: boolean | null
}

/** Libellé court affiché en capitales (synthèse). */
export function formatBonusTypeLabel(bonusType: string): string {
  const m: Record<string, string> = {
    zahia: "ZAHIA",
    suarez: "SUAREZ",
    cheat_code: "CHEAT CODE 18-26",
    "4decat": "4 DECAT",
    miroir: "MIROIR",
    tonton_pat: "TONTON PAT'",
    valise_nanard: "VALISE À NANARD",
    mcdo_plus: "MCDO+",
    capitaine: "CAPITAINE",
  }
  const k = bonusType.trim().toLowerCase()
  return m[k] ?? bonusType.trim().toUpperCase()
}

function tieBreakerMs(createdAt: string | null | undefined): number {
  if (!createdAt) return 0
  const t = Date.parse(createdAt)
  return Number.isFinite(t) ? t : 0
}

/**
 * Ordre éditorial : mirror_genius → victoires → miroir nul → autres (défaites / valise pour rien / etc.).
 */
function editorialSortTier(outcome: string): number {
  const o = outcome.trim().toLowerCase()
  if (o === "mirror_genius") return 1
  if (o === "win") return 2
  if (o === "mirror_draw") return 3
  return 4
}

/**
 * Construit le bloc « LES COUPS TORDUS DE LA JOURNÉE » à partir des bonus `highlight = true` uniquement.
 */
/** Attend des lignes déjà filtrées (`highlight = true`) depuis la requête. */
export function computeMatchdayBonusHighlight(
  bonuses: MatchBonusRecord[],
  managers: ManagerWithTeam[]
): BonusHighlightBlock | null {
  if (bonuses.length === 0) return null

  type Row = {
    coachName: string
    bonusTypeLabel: string
    narrative: string
    tier: number
    createdMs: number
  }

  const rows: Row[] = []

  for (const row of bonuses) {
    const mgr = managers.find((m) => m.id === row.manager_id)
    const coachName = mgr?.name?.trim() || "Le coach"
    const teamName = mgr?.team?.name?.trim() || "son équipe"
    const narrative = getBonusNarrative(row.bonus_type, row.bonus_outcome, coachName, teamName)
    if (!narrative) continue
    rows.push({
      coachName,
      bonusTypeLabel: formatBonusTypeLabel(row.bonus_type),
      narrative,
      tier: editorialSortTier(row.bonus_outcome),
      createdMs: tieBreakerMs(row.created_at ?? null),
    })
  }

  if (rows.length === 0) return null

  rows.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    return b.createdMs - a.createdMs
  })

  const entries: BonusNarrativeEntry[] = rows.map((r) => ({
    coachName: r.coachName,
    bonusTypeLabel: r.bonusTypeLabel,
    narrative: r.narrative,
  }))

  return {
    title: "LES COUPS TORDUS DE LA JOURNÉE",
    entries,
  }
}
