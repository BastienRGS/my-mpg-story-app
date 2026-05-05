import type { LeagueStoryKpi } from "@/lib/league-story-kpis"
import { getLoreForCoach, normalizeTeamName, resolveSeason10RosterTeamDivision } from "@/lib/league-lore"
import type { MatchBonusRecord } from "@/lib/matchday-narrative"
import type { Manager, ManagerWithTeam, MatchResult, StandingsHistoryWithManager, ValidatedMatchRow } from "@/lib/types"

function toWordsUpper(s: string, maxWords: number): string {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ")
    .toUpperCase()
}

/**
 * Sous-titre de une ligne sous la une : halons éditoriaux, 2-3 mots par signal fort.
 */
export function buildMastheadSubheadKicker(params: {
  managerOfWeek: LeagueStoryKpi
  matchOfWeek: LeagueStoryKpi
  storyKpis: LeagueStoryKpi[]
}): string {
  const { managerOfWeek, matchOfWeek, storyKpis } = params
  const segs: string[] = []

  if (managerOfWeek.hasData && (managerOfWeek.teamLabel || managerOfWeek.managerName)) {
    const t = managerOfWeek.teamLabel || managerOfWeek.managerName
    const tag = t ? getLoreForCoach(t) : null
    segs.push(
      tag ? toWordsUpper(tag, 4) : toWordsUpper(t, 2) + (t.split(/\s+/).length > 2 ? " · SÉRIE" : " EN TÊTE")
    )
  }
  if (matchOfWeek.hasData) {
    segs.push("ÉCLAIR DANS L’AFFICHE")
  }

  for (const k of storyKpis) {
    if (!k.hasData) continue
    if (k.slug === "match_of_round") continue
    const label = k.teamLabel
    if (!label) continue
    const tag = getLoreForCoach(label)
    if (tag) {
      segs.push(toWordsUpper(tag, 4))
    } else {
      segs.push(toWordsUpper(label, 3) + (k.slug === "nuclear_attack" ? " · BUTS" : ""))
    }
  }

  const seen = new Set<string>()
  const out: string[] = []
  for (const s of segs) {
    const t = s.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }

  return out.slice(0, 6).join(" · ") || "LA LIGUE ÉCRIT — EN TEMPS RÉEL"
}

/**
 * Titre de une : punchline s’il y en a une, sinon raccourci du résumé auto.
 */
export function buildMastheadHeadline(punchline: string | null, summaryText: string, ready: boolean, fallback: string): string {
  if (punchline?.trim()) {
    return punchline.trim()
  }
  if (!ready) {
    return fallback
  }
  const first = summaryText.split(/(?<=[.!?])\s+/u)[0]?.trim() || summaryText.trim()
  if (first.length > 200) {
    return first.slice(0, 197) + "…"
  }
  return first
}

export function seasonHeaderLabelFromSeasonName(seasonName: string, matchdayNumber: number): string {
  const m = seasonName.match(/(\d+)/g)
  if (m && m.length > 0) {
    return `JOURNÉE ${matchdayNumber} — SAISON ${m[m.length - 1]}`
  }
  return `JOURNÉE ${matchdayNumber} — ${seasonName.toUpperCase()}`
}

// --- Titres dynamiques dashboard (contexte mi-saison vs fin de saison) ---

export function getMatchWinner(match: Pick<MatchResult, "home_score" | "away_score">): "home" | "away" | "draw" {
  if (match.home_score > match.away_score) return "home"
  if (match.home_score < match.away_score) return "away"
  return "draw"
}

export function getManagerByTeamId(
  teamId: string,
  managers: ManagerWithTeam[]
): ManagerWithTeam | undefined {
  return managers.find((m) => m.team?.id === teamId)
}

export function getRankForManager(
  managerId: string,
  standings: StandingsHistoryWithManager[]
): number | undefined {
  const row = standings.find((s) => s.manager_id === managerId)
  const r = row?.rank
  return typeof r === "number" && Number.isFinite(r) ? r : undefined
}

export function isRolandoTeam(identityLabel: string): boolean {
  const n = normalizeTeamName(identityLabel)
  return n === normalizeTeamName("Golden Roosters") || n === normalizeTeamName("Jakattak")
}

export function isEndOfSeason(matchdayNumber: number, totalMatchdays: number): boolean {
  return matchdayNumber >= totalMatchdays
}

function displayTeamOrCoach(m: ManagerWithTeam): string {
  return (m.team?.name ?? m.name).trim() || m.name.trim()
}

function identityForRolando(m: ManagerWithTeam): string {
  return (m.identity_label?.trim() || m.team?.name || m.name || "").trim()
}

function capSentences(text: string, maxSentences: number): string {
  const parts = text.split(/(?<=[.!?])\s+/u).filter((p) => p.trim().length > 0)
  if (parts.length <= maxSentences) return text.trim()
  return parts.slice(0, maxSentences).join(" ").trim()
}

function seasonNumberFromName(seasonName: string): number {
  const m = seasonName.match(/(\d+)/g)
  if (m && m.length > 0) {
    const n = parseInt(m[m.length - 1]!, 10)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function frenchOrdinalFeminine(n: number): string {
  if (n === 1) return "1re"
  return `${n}e`
}

function teamWonMatch(teamId: string, m: Pick<ValidatedMatchRow, "home_team_id" | "away_team_id" | "home_score" | "away_score">): boolean {
  if (m.home_team_id === teamId) return m.home_score > m.away_score
  if (m.away_team_id === teamId) return m.away_score > m.home_score
  return false
}

function rosterLeagueForContext(managers: ManagerWithTeam[]): "L1" | "L2" | null {
  for (const m of managers) {
    const label = identityForRolando(m)
    if (!label) continue
    const { league, matchedRoster } = resolveSeason10RosterTeamDivision(label)
    if (matchedRoster) return league
  }
  return null
}

export type BuildDynamicHeadlineParams = {
  matchdayNumber: number
  totalMatchdays: number
  seasonName: string
  managers: ManagerWithTeam[]
  standingsHistory: StandingsHistoryWithManager[]
  validatedMatchRows: ValidatedMatchRow[]
  highlightedBonusesThisMatchday: MatchBonusRecord[]
}

export type DynamicHeadlineResult = { headline: string; intro: string }

/**
 * Une « à la une » + chapô pour le dashboard : mi-saison (classement courant) ou fin de saison (classement final).
 */
export function buildDynamicHeadline(params: BuildDynamicHeadlineParams): DynamicHeadlineResult {
  const {
    matchdayNumber,
    totalMatchdays,
    seasonName,
    managers,
    standingsHistory,
    validatedMatchRows,
    highlightedBonusesThisMatchday,
  } = params

  const rowsMd = standingsHistory
    .filter((r) => r.matchday_number === matchdayNumber)
    .sort((a, b) => a.rank - b.rank)

  const dayMatches = validatedMatchRows.filter((r) => r.matchday_number === matchdayNumber)
  const nTeams = rowsMd.length
  const eos = isEndOfSeason(matchdayNumber, totalMatchdays)
  const division = rosterLeagueForContext(managers)
  const seasonN = seasonNumberFromName(seasonName)

  const leaderRow = rowsMd.find((r) => r.rank === 1)
  const leaderMgr = leaderRow ? managers.find((m) => m.id === leaderRow.manager_id) : undefined
  const leaderName = leaderMgr ? displayTeamOrCoach(leaderMgr) : "Le leader"
  const leaderPts = leaderRow?.points ?? 0

  const secondRow = rowsMd.find((r) => r.rank === 2)

  const fallbackMid = (): DynamicHeadlineResult => ({
    headline: `Journée ${matchdayNumber} : les cartes sont redistribuées.`,
    intro: capSentences(
      `${leaderName} reste en tête avec ${leaderPts} points. Mais dans cette ligue, rien n'est jamais acquis.`,
      3
    ),
  })

  const fallbackEnd = (): DynamicHeadlineResult => ({
    headline: seasonN > 0 ? `Rideau. La saison ${seasonN} s'achève.` : `Rideau. La saison s'achève.`,
    intro: capSentences(`${leaderName} termine en tête avec ${leaderPts} points. Une saison de plus dans les livres de la Gazzattak.`, 3),
  })

  if (eos) {
    // --- Fin de saison (priorités 1 → 4 comme cahier des charges) ---
    if (division === "L1") {
      const r1 = rowsMd.find((r) => r.rank === 1)
      const m1 = r1 ? managers.find((m) => m.id === r1.manager_id) : undefined
      if (m1 && isRolandoTeam(identityForRolando(m1))) {
        const team = displayTeamOrCoach(m1)
        return {
          headline: "Encore les frangins. La dynastie Rolando écrase tout, encore.",
          intro: capSentences(
            `Encore un titre dans la besace des frangins. ${team} confirme : la dynastie Rolando continue d'écraser la ligue. Tant que les trophées restent à la maison, les autres jouent surtout pour les miettes.`,
            3
          ),
        }
      }
    }

    if (division === "L1" && nTeams >= 8) {
      const relegRolando = rowsMd.find((r) => {
        if (r.rank !== 7 && r.rank !== 8) return false
        const mgr = managers.find((m) => m.id === r.manager_id)
        return Boolean(mgr && isRolandoTeam(identityForRolando(mgr)))
      })
      if (relegRolando) {
        return {
          headline: "Le trône vacille. Un Rolando file en Ligue 2.",
          intro: capSentences(
            "Pendant que l'un sauve l'honneur familial, l'autre file en Ligue 2. La dynastie tient encore debout… mais la maison Rolando vacille.",
            3
          ),
        }
      }
    }

    if (division === "L2") {
      const r3 = rowsMd.find((r) => r.rank === 3)
      const m3 = r3 ? managers.find((m) => m.id === r3.manager_id) : undefined
      if (m3 && isRolandoTeam(identityForRolando(m3))) {
        const team = displayTeamOrCoach(m3)
        return {
          headline: "La mallette n'était visiblement pas assez lourde.",
          intro: capSentences(
            `${team} échoue au pied de la montée et restera bloqué en Ligue 2. Face à la Mafia Rolandèse, il ne suffit pas de donner… il faut aussi savoir donner plus que les autres.`,
            3
          ),
        }
      }
    }

    if (division === "L1" && nTeams >= 8) {
      const r7 = rowsMd.find((r) => r.rank === 7)
      const r8 = rowsMd.find((r) => r.rank === 8)
      const m7 = r7 ? managers.find((m) => m.id === r7.manager_id) : undefined
      const m8 = r8 ? managers.find((m) => m.id === r8.manager_id) : undefined
      if (m7 && m8) {
        const t7 = displayTeamOrCoach(m7)
        const t8 = displayTeamOrCoach(m8)
        return {
          headline: "La sentence est tombée. Deux équipes quittent l'élite.",
          intro: capSentences(
            `${t7} et ${t8} sont priés de quitter l'élite. Ils suivront la Ligue 1 depuis le canapé la saison prochaine.`,
            3
          ),
        }
      }
    }

    return fallbackEnd()
  }

  // --- Mi-saison ---

  // PRIORITY 1 — Score fleuve
  let bestMd: ValidatedMatchRow | null = null
  let bestTotal = -1
  for (const m of dayMatches) {
    const sum = m.home_score + m.away_score
    const margin = Math.abs(m.home_score - m.away_score)
    if (sum >= 8 && margin >= 4 && sum > bestTotal) {
      bestTotal = sum
      bestMd = m
    }
  }
  if (bestMd) {
    const w = getMatchWinner(bestMd)
    if (w !== "draw") {
      const hm = getManagerByTeamId(bestMd.home_team_id, managers)
      const am = getManagerByTeamId(bestMd.away_team_id, managers)
      if (hm && am) {
        const winner = w === "home" ? hm : am
        const loser = w === "home" ? am : hm
        const wn = displayTeamOrCoach(winner)
        const ln = displayTeamOrCoach(loser)
        const ws = w === "home" ? bestMd.home_score : bestMd.away_score
        const ls = w === "home" ? bestMd.away_score : bestMd.home_score
        return {
          headline: `${wn} humilie ${ln}. ${ws}-${ls}. Le football, parfois, c'est cruel.`,
          intro: capSentences(
            `Un score fleuve qui résume tout. ${wn} n'a pas fait dans la dentelle. ${ln} voudrait oublier cette journée au plus vite.`,
            3
          ),
        }
      }
    }
  }

  // PRIORITY 2 — Upset
  if (nTeams >= 6) {
    for (const mat of dayMatches) {
      const hm = getManagerByTeamId(mat.home_team_id, managers)
      const am = getManagerByTeamId(mat.away_team_id, managers)
      if (!hm || !am) continue
      const hr = getRankForManager(hm.id, rowsMd)
      const ar = getRankForManager(am.id, rowsMd)
      if (hr == null || ar == null) continue
      const hasTopThree = hr <= 3 || ar <= 3
      const hasBottomThree = hr >= nTeams - 2 || ar >= nTeams - 2
      if (!hasTopThree || !hasBottomThree) continue
      const w = getMatchWinner(mat)
      if (w === "draw") continue
      const winner = w === "home" ? hm : am
      const loser = w === "home" ? am : hm
      const wr = getRankForManager(winner.id, rowsMd)
      const lr = getRankForManager(loser.id, rowsMd)
      if (wr == null || lr == null) continue
      if (wr >= nTeams - 2 && lr <= 3) {
        return {
          headline: "L'upset de la journée. Personne ne l'avait vu venir.",
          intro: capSentences(
            `${displayTeamOrCoach(winner)} renverse ${displayTeamOrCoach(loser)}. Le classement ne veut plus rien dire. La Gazzattak adore ces journées-là.`,
            3
          ),
        }
      }
    }
  }

  // PRIORITY 3 — Choc au sommet serré
  const rowTop1 = rowsMd.find((r) => r.rank === 1)
  const rowTop2 = rowsMd.find((r) => r.rank === 2)
  if (rowTop1 && rowTop2) {
    const mA = managers.find((m) => m.id === rowTop1.manager_id)
    const mB = managers.find((m) => m.id === rowTop2.manager_id)
    const tA = mA?.team?.id
    const tB = mB?.team?.id
    if (tA && tB) {
      const clash = dayMatches.find(
        (d) =>
          (d.home_team_id === tA && d.away_team_id === tB) || (d.home_team_id === tB && d.away_team_id === tA)
      )
      if (clash && Math.abs(clash.home_score - clash.away_score) <= 1) {
        const n1 = mA ? displayTeamOrCoach(mA) : "Le premier"
        const n2 = mB ? displayTeamOrCoach(mB) : "le second"
        return {
          headline: "Le choc au sommet tourne au combat de rue. Rien n'est réglé.",
          intro: capSentences(
            `${n1} et ${n2} se neutralisent. La tension est maximale. Le titre se jouera ailleurs, une autre fois.`,
            3
          ),
        }
      }
    }
  }

  // PRIORITY 4 — Chute libre
  for (const r of rowsMd) {
    const streak = r.lose_streak ?? 0
    if (streak >= 3) {
      const mgr = managers.find((m) => m.id === r.manager_id)
      if (!mgr) continue
      const team = displayTeamOrCoach(mgr)
      const ord = frenchOrdinalFeminine(streak)
      let intro = `${team} enchaîne une ${ord} défaite consécutive. Le vestiaire brûle, le classement s'effondre.`
      const loreTag = getLoreForCoach(mgr.team?.name?.trim() || identityForRolando(mgr))
      if (loreTag) {
        intro += ` Cette équipe traîne déjà l'étiquette « ${loreTag} » — ce soir, l'étiquette colle encore plus fort.`
      }
      return {
        headline: `La crise est totale. ${team} n'en finit plus de chuter.`,
        intro: capSentences(intro, 3),
      }
    }
  }

  // PRIORITY 5 — Leader consolide
  if (leaderRow && secondRow && leaderMgr?.team?.id) {
    const tid = leaderMgr.team.id
    const lm = dayMatches.find((d) => d.home_team_id === tid || d.away_team_id === tid)
    if (lm && teamWonMatch(tid, lm)) {
      const gap = (leaderRow.points ?? 0) - (secondRow.points ?? 0)
      if (gap >= 3) {
        const secondMgr = managers.find((m) => m.id === secondRow.manager_id)
        const secondName = secondMgr ? displayTeamOrCoach(secondMgr) : "le dauphin"
        return {
          headline: `${leaderName} consolide le trône. La concurrence regarde.`,
          intro: capSentences(
            `${leaderName} prend encore de l'avance avec ${gap} points d'écart sur ${secondName}. La course au titre commence à ressembler à un monologue.`,
            3
          ),
        }
      }
    }
  }

  // PRIORITY 6 — Rolando lanterne
  if (nTeams > 0) {
    const maxR = Math.max(...rowsMd.map((r) => r.rank))
    const lastRows = rowsMd.filter((r) => r.rank === maxR)
    const rLast = lastRows[0]
    const mLast = rLast ? managers.find((m) => m.id === rLast.manager_id) : undefined
    if (mLast && isRolandoTeam(identityForRolando(mLast))) {
      const team = displayTeamOrCoach(mLast)
      return {
        headline: "Le trône vacille chez les Rolando.",
        intro: capSentences(
          `La dynastie tient encore debout… mais les fissures commencent à se voir. ${team} pointe en dernière position. Impensable, et pourtant.`,
          3
        ),
      }
    }
  }

  // PRIORITY 7 — Rolando en tête
  const r1mid = rowsMd.find((r) => r.rank === 1)
  const m1mid = r1mid ? managers.find((m) => m.id === r1mid.manager_id) : undefined
  if (m1mid && isRolandoTeam(identityForRolando(m1mid))) {
    const team = displayTeamOrCoach(m1mid)
    return {
      headline: `${team} en tête. La dynastie Rolando domine encore.`,
      intro: capSentences(
        `${team} confirme : la dynasty Rolando continue de dominer la Ligue 1. Est-ce encore un titre dans la besace des frangins ?`,
        3
      ),
    }
  }

  // PRIORITY 8 — Bonus décisif
  const decisiveBonus = highlightedBonusesThisMatchday.find((b) => {
    if (b.highlight !== true) return false
    const o = b.bonus_outcome.trim().toLowerCase()
    return o === "win" || o === "mirror_genius"
  })
  if (decisiveBonus) {
    const coachM = managers.find((m) => m.id === decisiveBonus.manager_id)
    const coach = coachM?.name?.trim() || "Le coach"
    return {
      headline: `Le coup tactique de la journée. ${coach} avait le bon plan.`,
      intro: capSentences(
        `${coach} sort le bon bonus au bon moment. Stratège ou chanceux ? Dans cette ligue, la frontière est mince.`,
        3
      ),
    }
  }

  return fallbackMid()
}
