import { getBonusNarrative } from "@/lib/bonus-narrative"
import { normalizeTeamName, resolveSeason10RosterTeamDivision } from "@/lib/league-lore"
import type { BonusHighlightBlock, BonusNarrativeEntry, ManagerWithTeam, StandingsHistoryWithManager } from "@/lib/types"

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

// --- Zone de danger / Zone de promotion ---

export type DangerZoneBlock = { title: string; text: string } | null
export type PromotionZoneBlock = { title: string; text: string } | null

function rosterDivisionForDanger(managers: ManagerWithTeam[]): "L1" | "L2" | null {
  for (const m of managers) {
    const label = (m.identity_label?.trim() || m.team?.name || m.name || "").trim()
    if (!label) continue
    const { league, matchedRoster } = resolveSeason10RosterTeamDivision(label)
    if (matchedRoster) return league
  }
  return null
}

function dangerZoneLore(mgr: ManagerWithTeam): string | null {
  const identity = (mgr.identity_label?.trim() || mgr.team?.name || mgr.name || "").trim()
  const n = normalizeTeamName(identity)
  if (n === normalizeTeamName("Bab Olympique")) return "La légende déchue flirte avec l'abîme."
  if (n === normalizeTeamName("Deepblue")) return "Le yo-yo reprend. Direction Ligue 2 ?"
  if (n === normalizeTeamName("Madinviet")) return "Le champion déchu en zone rouge. L'ironie est cruelle."
  return null
}

function teamDisplayName(m: ManagerWithTeam): string {
  return m.team?.name?.trim() || m.name?.trim() || "Équipe"
}

export function computeDangerZone(params: {
  standingsRows: StandingsHistoryWithManager[]
  managers: ManagerWithTeam[]
  remainingMatchdays: number
  isEndOfSeason: boolean
}): DangerZoneBlock {
  const { standingsRows, managers, remainingMatchdays, isEndOfSeason } = params

  console.log("dangerZone isEndOfSeason:", isEndOfSeason)

  const division = rosterDivisionForDanger(managers)
  console.log("dangerZone division detected:", division)
  console.log(
    "dangerZone managers sample:",
    managers.slice(0, 3).map((m) => ({
      identity_label: m.identity_label,
      team_name: m.team?.name,
      name: m.name,
    }))
  )
  if (division !== "L1") return null

  const sorted = [...standingsRows].sort((a, b) => a.rank - b.rank)
  const nTeams = sorted.length
  if (nTeams < 3) return null

  const rowBot = sorted[nTeams - 1]
  const row2nd = sorted[nTeams - 2]
  const row3rd = sorted[nTeams - 3]
  if (!rowBot || !row2nd || !row3rd) return null

  const ptsBot = rowBot.points ?? 0
  const pts2nd = row2nd.points ?? 0
  const pts3rd = row3rd.points ?? 0

  const streakBot = rowBot.lose_streak ?? 0
  const streak2nd = row2nd.lose_streak ?? 0

  const mgrBot = managers.find((m) => m.id === rowBot.manager_id)
  const mgr2nd = managers.find((m) => m.id === row2nd.manager_id)
  const mgr3rd = managers.find((m) => m.id === row3rd.manager_id)

  console.log("dangerZone bottom2:", {
    bot: {
      name: mgrBot ? teamDisplayName(mgrBot) : rowBot.manager_id,
      pts: ptsBot,
      lose_streak: rowBot.lose_streak,
    },
    sec: {
      name: mgr2nd ? teamDisplayName(mgr2nd) : row2nd.manager_id,
      pts: pts2nd,
      lose_streak: row2nd.lose_streak,
    },
    third: { pts: pts3rd },
  })
  console.log("dangerZone conditions checked:", {
    streakBot,
    streak2nd,
    pts3rdMinusPtsBot: pts3rd - ptsBot,
    pts3rdMinusPts2nd: pts3rd - pts2nd,
    conditionMet:
      streakBot >= 2 || streak2nd >= 2 || pts3rd - ptsBot <= 3 || pts3rd - pts2nd <= 3,
  })

  // Mid-season gate: skip if no team is close enough to the danger zone
  const conditionMet =
    streakBot >= 2 || streak2nd >= 2 || pts3rd - ptsBot <= 3 || pts3rd - pts2nd <= 3
  if (!isEndOfSeason && !conditionMet) return null

  if (!mgrBot || !mgr2nd) return null

  const nameBot = teamDisplayName(mgrBot)
  const name2nd = teamDisplayName(mgr2nd)
  const name3rd = mgr3rd ? teamDisplayName(mgr3rd) : "L'équipe juste au-dessus"

  function loreSuffix(...mgrs: (ManagerWithTeam | undefined)[]): string {
    const parts = mgrs
      .flatMap((m) => (m ? [dangerZoneLore(m)] : []))
      .filter((s): s is string => s !== null)
    return parts.length > 0 ? "\n" + parts.join(" ") : ""
  }

  // --- Fin de saison ---
  if (isEndOfSeason) {
    if (streakBot >= 3) {
      return {
        title: "🚨 RELÉGATION CONFIRMÉE",
        text:
          `${name2nd} et ${nameBot} terminent dans la zone rouge.\n` +
          `${nameBot} enchaîne ${streakBot} défaites.\n` +
          `Direction la Ligue 2 pour une saison de remise à niveau.` +
          loreSuffix(mgr2nd, mgrBot),
      }
    }
    return {
      title: "⬇️ LES RELÉGUÉS",
      text:
        `${name2nd} et ${nameBot} quittent l'élite.\n` +
        `La Ligue 1 ne pardonne pas les mauvaises saisons.\n` +
        `Rendez-vous en Ligue 2.` +
        loreSuffix(mgr2nd, mgrBot),
    }
  }

  // --- Mi-saison ---

  // Sub-case 1 — Bottom team lose_streak >= 3
  if (streakBot >= 3) {
    const gap = pts3rd - ptsBot
    return {
      title: "🚨 LICENCIEMENT À L'ÉTUDE",
      text:
        `${nameBot} enchaîne ${streakBot} défaites de suite.\n` +
        `Le maintien s'éloigne à grands pas.\n` +
        `${gap} point${gap !== 1 ? "s" : ""} de retard sur la safe zone.` +
        loreSuffix(mgrBot),
    }
  }

  // Sub-case 2 — Both bottom 2 within 2 pts of each other
  const gapBetween = Math.abs(pts2nd - ptsBot)
  if (gapBetween <= 2) {
    return {
      title: "⚠️ DUEL POUR LA SURVIE",
      text:
        `${name2nd} et ${nameBot} se tiennent en ${gapBetween} point${gapBetween !== 1 ? "s" : ""}.\n` +
        `Le perdant de ce duel à distance coule un peu plus.\n` +
        `La Ligue 2 attend son monde.` +
        loreSuffix(mgr2nd, mgrBot),
    }
  }

  // Sub-case 3 — 3rd from bottom within 2 pts of relegation zone
  const gapAbove = Math.abs(pts3rd - pts2nd)
  if (gapAbove <= 2 && mgr3rd) {
    return {
      title: "😰 ÇA SENT LE ROUSSI",
      text:
        `${name3rd} n'est qu'à ${gapAbove} point${gapAbove !== 1 ? "s" : ""} de la zone rouge.\n` +
        `Une mauvaise série et c'est la panique.\n` +
        `Trois équipes pour deux places de condamnés.` +
        loreSuffix(mgr3rd),
    }
  }

  // Sub-case 4 — Generic fallback
  return {
    title: "⚠️ ZONE DE DANGER",
    text:
      `${name2nd} et ${nameBot} sont dans la zone de relégation.\n` +
      `Il reste ${remainingMatchdays} journée${remainingMatchdays !== 1 ? "s" : ""} pour se sauver.\n` +
      `Le compte à rebours est lancé.` +
      loreSuffix(mgr2nd, mgrBot),
  }
}

// --- Zone de promotion (L2 uniquement) ---

function promotionZoneLore(mgr: ManagerWithTeam): string | null {
  const identity = (mgr.identity_label?.trim() || mgr.team?.name || mgr.name || "").trim()
  const n = normalizeTeamName(identity)
  if (n === normalizeTeamName("Bab Olympique"))
    return "Bab Olympique retrouve l'élite. Le premier champion de l'histoire est de retour."
  if (n === normalizeTeamName("Madinviet"))
    return "Madinviet remonte en L1. Le champion de S8 reprend sa place."
  if (n === normalizeTeamName("Deepblue"))
    return "Deepblue remonte. Le yo-yo continue, cette fois vers le haut."
  return null
}

export function computePromotionZone(params: {
  standingsRows: StandingsHistoryWithManager[]
  managers: ManagerWithTeam[]
  remainingMatchdays: number
  isEndOfSeason: boolean
}): PromotionZoneBlock {
  const { standingsRows, managers, remainingMatchdays, isEndOfSeason } = params

  const division = rosterDivisionForDanger(managers)
  if (division !== "L2") return null

  const sorted = [...standingsRows].sort((a, b) => a.rank - b.rank)
  if (sorted.length < 2) return null

  const row1 = sorted[0]
  const row2 = sorted[1]
  const row3 = sorted[2]
  if (!row1 || !row2) return null

  const mgr1 = managers.find((m) => m.id === row1.manager_id)
  const mgr2 = managers.find((m) => m.id === row2.manager_id)
  const mgr3 = row3 ? managers.find((m) => m.id === row3.manager_id) : undefined
  if (!mgr1 || !mgr2) return null

  const name1 = teamDisplayName(mgr1)
  const name2 = teamDisplayName(mgr2)

  const pts2 = row2.points ?? 0
  const pts3 = row3?.points ?? 0
  const winStreak1 = row1.win_streak ?? 0

  function loreSuffix(...mgrs: (ManagerWithTeam | undefined)[]): string {
    const parts = mgrs
      .flatMap((m) => (m ? [promotionZoneLore(m)] : []))
      .filter((s): s is string => s !== null)
    return parts.length > 0 ? "\n" + parts.join(" ") : ""
  }

  // --- Fin de saison ---
  if (isEndOfSeason) {
    return {
      title: "⬆️ LES PROMUS",
      text:
        `${name1} et ${name2} quittent la Ligue 2 par la grande porte.\n` +
        `Bienvenue dans la cour des grands.\n` +
        `Ça va piquer en Ligue 1.` +
        loreSuffix(mgr1, mgr2),
    }
  }

  // --- Mi-saison ---

  // Sub-case 1 — Top team on a win streak >= 3
  if (winStreak1 >= 3) {
    return {
      title: "🚀 EN ROUTE POUR LA L1",
      text:
        `${name1} enchaîne ${winStreak1} victoires et file vers la Ligue 1.\n` +
        `${name2} suit de près avec ${pts2} point${pts2 !== 1 ? "s" : ""}.\n` +
        `La montée se dessine mais rien n'est joué.` +
        loreSuffix(mgr1, mgr2),
    }
  }

  // Sub-case 2 — Gap between rank 2 and rank 3 <= 2 pts
  const gapAbove = Math.abs(pts2 - pts3)
  if (row3 && mgr3 && gapAbove <= 2) {
    const name3 = teamDisplayName(mgr3)
    return {
      title: "⚔️ BATAILLE POUR LA MONTÉE",
      text:
        `${name2} et ${name3} se tiennent en ${gapAbove} point${gapAbove !== 1 ? "s" : ""}.\n` +
        `La 2e place qui monte en L1 est encore à prendre.\n` +
        `Chaque journée compte double.` +
        loreSuffix(mgr2, mgr3),
    }
  }

  // Sub-case 3 — Generic fallback
  return {
    title: "⬆️ EN ROUTE VERS L'ÉLITE",
    text:
      `${name1} et ${name2} occupent les places qui mènent en Ligue 1.\n` +
      `Il reste ${remainingMatchdays} journée${remainingMatchdays !== 1 ? "s" : ""} pour valider la montée.` +
      loreSuffix(mgr1, mgr2),
  }
}
