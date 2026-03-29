import type { ManagerWithTeam, StandingsHistoryWithManager, ValidatedMatchRow } from "@/lib/types"

export type LeagueStoryKpiSlug =
  | "hot_coach"
  | "crisis_coach"
  | "defensive_wall"
  | "nuclear_attack"
  | "comeback"
  | "leader_pressure"
  | "match_of_round"

export type LeagueStoryKpi = {
  slug: LeagueStoryKpiSlug
  title: string
  managerName: string
  teamLabel: string
  detail: string
  hasData: boolean
}

function displayName(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

function managerById(managers: ManagerWithTeam[], id: string): ManagerWithTeam | undefined {
  return managers.find((m) => m.id === id)
}

function labelForTeamId(managers: ManagerWithTeam[], teamId: string): string {
  const m = managers.find((x) => x.team?.id === teamId)
  return m ? displayName(m) : "Équipe"
}

function empty(slug: LeagueStoryKpiSlug, title: string): LeagueStoryKpi {
  return {
    slug,
    title,
    managerName: "—",
    teamLabel: "",
    detail: "Pas encore assez de données.",
    hasData: false,
  }
}

/**
 * KPIs narratifs dérivés du classement (historique) + derniers scores pour le match phare.
 * Pas de métriques type « hold-up » sans données dédiées.
 */
export function computeLeagueStoryKpis(
  managers: ManagerWithTeam[],
  standingsHistory: StandingsHistoryWithManager[],
  matchRows: ValidatedMatchRow[]
): LeagueStoryKpi[] {
  const matchdays = [...new Set(standingsHistory.map((r) => r.matchday_number))].sort((a, b) => a - b)
  const firstMd = matchdays[0]
  const lastMd = matchdays[matchdays.length - 1]
  const prevMd = matchdays.length >= 2 ? matchdays[matchdays.length - 2] : null

  const rankAt = (md: number, managerId: string): number | null => {
    const row = standingsHistory.find((r) => r.matchday_number === md && r.manager_id === managerId)
    return row?.rank ?? null
  }

  const rowAt = (md: number, managerId: string): StandingsHistoryWithManager | null => {
    return standingsHistory.find((r) => r.matchday_number === md && r.manager_id === managerId) ?? null
  }

  const rowsLast =
    lastMd != null ? standingsHistory.filter((r) => r.matchday_number === lastMd) : []

  // --- Coach en feu : meilleure progression de places sur la dernière journée ---
  let hot: LeagueStoryKpi = empty("hot_coach", "Coach en feu")
  if (prevMd != null && lastMd != null) {
    let bestId: string | null = null
    let bestDelta = 0
    for (const m of managers) {
      const r0 = rankAt(prevMd, m.id)
      const r1 = rankAt(lastMd, m.id)
      if (r0 == null || r1 == null) continue
      const delta = r0 - r1
      if (delta > bestDelta) {
        bestDelta = delta
        bestId = m.id
      }
    }
    if (bestId && bestDelta > 0) {
      const mgr = managerById(managers, bestId)!
      hot = {
        slug: "hot_coach",
        title: "Coach en feu",
        managerName: mgr.name,
        teamLabel: displayName(mgr),
        detail: `+${bestDelta} place${bestDelta > 1 ? "s" : ""} après la J${lastMd}.`,
        hasData: true,
      }
    }
  }

  // --- Coach en crise : plus forte chute de places sur la dernière journée (ex æquo : plus longue série de défaites) ---
  let crisis: LeagueStoryKpi = empty("crisis_coach", "Coach en crise")
  if (prevMd != null && lastMd != null) {
    let worstId: string | null = null
    let worstDrop = 0
    let tieLoseStreak = -1
    for (const m of managers) {
      const r0 = rankAt(prevMd, m.id)
      const r1 = rankAt(lastMd, m.id)
      if (r0 == null || r1 == null) continue
      const drop = r1 - r0
      const ls = rowAt(lastMd, m.id)?.lose_streak ?? 0
      if (drop > worstDrop || (drop === worstDrop && drop > 0 && ls > tieLoseStreak)) {
        worstDrop = drop
        tieLoseStreak = ls
        worstId = m.id
      }
    }
    if (worstId && worstDrop > 0) {
      const mgr = managerById(managers, worstId)!
      const ls = rowAt(lastMd, worstId)?.lose_streak
      const streakBit =
        ls && ls >= 2 ? ` Série de ${ls} défaites.` : ""
      crisis = {
        slug: "crisis_coach",
        title: "Coach en crise",
        managerName: mgr.name,
        teamLabel: displayName(mgr),
        detail: `−${worstDrop} place${worstDrop > 1 ? "s" : ""} après la J${lastMd}.${streakBit}`,
        hasData: true,
      }
    }
  }

  // --- Plus grosse remontée : depuis la première journée suivie ---
  let comeback: LeagueStoryKpi = empty("comeback", "Plus grosse remontée")
  if (firstMd != null && lastMd != null && firstMd !== lastMd) {
    let bestId: string | null = null
    let best = 0
    for (const m of managers) {
      const r0 = rankAt(firstMd, m.id)
      const r1 = rankAt(lastMd, m.id)
      if (r0 == null || r1 == null) continue
      const climb = r0 - r1
      if (climb > best) {
        best = climb
        bestId = m.id
      }
    }
    if (bestId && best > 0) {
      const mgr = managerById(managers, bestId)!
      comeback = {
        slug: "comeback",
        title: "Plus grosse remontée",
        managerName: mgr.name,
        teamLabel: displayName(mgr),
        detail: `Depuis la J${firstMd} : +${best} place${best > 1 ? "s" : ""}.`,
        hasData: true,
      }
    }
  }

  // --- Mur défensif / Attaque nucléaire : parmi les équipes ayant joué le max de matchs à cette date ---
  let wall: LeagueStoryKpi = empty("defensive_wall", "Mur défensif")
  let attack: LeagueStoryKpi = empty("nuclear_attack", "Attaque nucléaire")
  if (lastMd != null && rowsLast.length > 0) {
    const played = (id: string) => rowAt(lastMd, id)?.matches_played ?? 0
    const maxPlayed = Math.max(...managers.map((m) => played(m.id)), 0)
    const eligible = managers.filter((m) => played(m.id) === maxPlayed && maxPlayed > 0)

    if (eligible.length > 0) {
      const byGa = [...eligible].sort(
        (a, b) =>
          (rowAt(lastMd, a.id)!.goals_against ?? 0) - (rowAt(lastMd, b.id)!.goals_against ?? 0)
      )
      const bestD = byGa[0]
      const dRow = rowAt(lastMd, bestD.id)!
      wall = {
        slug: "defensive_wall",
        title: "Mur défensif",
        managerName: bestD.name,
        teamLabel: displayName(bestD),
        detail: `${dRow.goals_against ?? 0} but encaissé${(dRow.goals_against ?? 0) > 1 ? "s" : ""} après la J${lastMd}.`,
        hasData: true,
      }

      const byGf = [...eligible].sort(
        (a, b) =>
          (rowAt(lastMd, b.id)!.goals_for ?? 0) - (rowAt(lastMd, a.id)!.goals_for ?? 0)
      )
      const bestA = byGf[0]
      const aRow = rowAt(lastMd, bestA.id)!
      attack = {
        slug: "nuclear_attack",
        title: "Attaque nucléaire",
        managerName: bestA.name,
        teamLabel: displayName(bestA),
        detail: `${aRow.goals_for ?? 0} but marqué${(aRow.goals_for ?? 0) > 1 ? "s" : ""} après la J${lastMd}.`,
        hasData: true,
      }
    }
  }

  // --- Leader sous pression : leader avec l’écart de points le plus faible sur le 2e ---
  let pressure: LeagueStoryKpi = empty("leader_pressure", "Leader sous pression")
  if (lastMd != null && rowsLast.length >= 2) {
    const sorted = [...rowsLast].sort((a, b) => {
      const pa = a.points ?? 0
      const pb = b.points ?? 0
      if (pb !== pa) return pb - pa
      const gda = (a.goals_for ?? 0) - (a.goals_against ?? 0)
      const gdb = (b.goals_for ?? 0) - (b.goals_against ?? 0)
      if (gdb !== gda) return gdb - gda
      return (b.goals_for ?? 0) - (a.goals_for ?? 0)
    })
    const topPts = sorted[0].points ?? 0
    const second = sorted.find((r) => (r.points ?? 0) < topPts)
    if (second) {
      const gap = topPts - (second.points ?? 0)
      const leadMgrId = sorted[0].manager_id
      const mgr = managerById(managers, leadMgrId)
      // « Sous pression » seulement si l’écart au 2e est crédiblement serré (sinon ce n’est pas un KPI narratif).
      if (mgr && gap >= 1 && gap <= 3) {
        pressure = {
          slug: "leader_pressure",
          title: "Leader sous pression",
          managerName: mgr.name,
          teamLabel: displayName(mgr),
          detail: `Seulement +${gap} pt${gap > 1 ? "s" : ""} sur le 2e après la J${lastMd}.`,
          hasData: true,
        }
      }
    }
  }

  // --- Match de la journée : plus grand total de buts sur la dernière J (puis écart le plus large) ---
  let motw: LeagueStoryKpi = empty("match_of_round", "Match de la journée")
  if (lastMd != null && matchRows.length > 0) {
    const day = matchRows.filter((m) => m.matchday_number === lastMd)
    let best: ValidatedMatchRow | null = null
    let bestTotal = -1
    let bestDiff = -1
    for (const m of day) {
      const t = m.home_score + m.away_score
      const d = Math.abs(m.home_score - m.away_score)
      if (t > bestTotal || (t === bestTotal && d > bestDiff)) {
        bestTotal = t
        bestDiff = d
        best = m
      }
    }
    if (best && bestTotal >= 0) {
      const h = labelForTeamId(managers, best.home_team_id)
      const a = labelForTeamId(managers, best.away_team_id)
      motw = {
        slug: "match_of_round",
        title: "Match de la journée",
        managerName: `${h} – ${a}`,
        teamLabel: `J${lastMd}`,
        detail: `Score : ${best.home_score}–${best.away_score} (${bestTotal} but${bestTotal > 1 ? "s" : ""} au total).`,
        hasData: true,
      }
    }
  }

  return [hot, crisis, wall, attack, comeback, pressure, motw]
}

export function buildEpisodeTeaser(params: {
  leagueName: string
  matchdayNumber: number
  leaderLabel: string
  lastPlaceLabel: string
}): string {
  return `${params.leagueName}, J${params.matchdayNumber} : ${params.leaderLabel} garde le tempo, pendant que ${params.lastPlaceLabel} cherche l’étincelle.`
}

export function snapshotLatestStandings(
  managers: ManagerWithTeam[],
  standingsHistory: StandingsHistoryWithManager[]
): {
  matchdayNumber: number
  leaderDisplay: string
  lastPlaceDisplay: string
} | null {
  if (standingsHistory.length === 0) return null
  const lastMd = Math.max(...standingsHistory.map((r) => r.matchday_number))
  const rows = standingsHistory.filter((r) => r.matchday_number === lastMd)
  if (rows.length === 0) return null
  const leaderRow = rows.find((r) => r.rank === 1)
  const worst = rows.reduce((a, b) => (b.rank > a.rank ? b : a), rows[0])
  const label = (id: string) => {
    const m = managers.find((x) => x.id === id)
    return m ? displayName(m) : "—"
  }
  return {
    matchdayNumber: lastMd,
    leaderDisplay: leaderRow ? label(leaderRow.manager_id) : "—",
    lastPlaceDisplay: worst ? label(worst.manager_id) : "—",
  }
}
