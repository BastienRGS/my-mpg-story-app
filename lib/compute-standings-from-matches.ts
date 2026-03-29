import type { ManagerWithTeam, StandingsHistoryWithManager, ValidatedMatchRow } from "@/lib/types"

type TeamToManager = Map<string, string>

type AggState = {
  points: number
  gf: number
  ga: number
  played: number
  /** Ordre chronologique sur la saison : W | D | L */
  results: ("W" | "D" | "L")[]
}

function emptyAgg(): AggState {
  return { points: 0, gf: 0, ga: 0, played: 0, results: [] }
}

function recordResult(agg: AggState, letter: "W" | "D" | "L") {
  agg.results.push(letter)
  if (letter === "W") agg.points += 3
  else if (letter === "D") agg.points += 1
}

function formString(results: ("W" | "D" | "L")[]): string {
  return results
    .slice(-5)
    .map((x) => x)
    .join("")
}

function streaksFromResults(results: ("W" | "D" | "L")[]): { win: number; lose: number } {
  let win = 0
  let lose = 0
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i]
    if (r === "W") {
      if (lose > 0) break
      win++
    } else if (r === "L") {
      if (win > 0) break
      lose++
    } else {
      break
    }
  }
  return { win, lose }
}

function sameStanding(a: AggState, b: AggState): boolean {
  const gda = a.gf - a.ga
  const gdb = b.gf - b.ga
  return a.points === b.points && gda === gdb && a.gf === b.gf
}

function rankManagers(managerIds: string[], agg: Map<string, AggState>): Map<string, number> {
  const sorted = [...managerIds].sort((ma, mb) => {
    const a = agg.get(ma)!
    const b = agg.get(mb)!
    if (b.points !== a.points) return b.points - a.points
    const gda = a.gf - a.ga
    const gdb = b.gf - b.ga
    if (gdb !== gda) return gdb - gda
    return b.gf - a.gf
  })

  const rankByManager = new Map<string, number>()
  let currentRank = 1
  for (let i = 0; i < sorted.length; i++) {
    const id = sorted[i]
    if (i > 0 && !sameStanding(agg.get(id)!, agg.get(sorted[i - 1])!)) {
      currentRank = i + 1
    }
    rankByManager.set(id, currentRank)
  }
  return rankByManager
}

function buildTeamToManagerMap(managers: ManagerWithTeam[]): TeamToManager {
  const m = new Map<string, string>()
  for (const mgr of managers) {
    const tid = mgr.team?.id
    if (tid) m.set(tid, mgr.id)
  }
  return m
}

/**
 * Agrège les matchs validés (3-1-0, buts) → historique de classement par journée.
 * Prérequis : `matches` déjà passés par `validateSeasonMatchResults` (équipes connues, scores entiers).
 */
export function computeStandingsHistoryFromMatches(
  seasonId: string,
  managers: ManagerWithTeam[],
  matches: ValidatedMatchRow[]
): StandingsHistoryWithManager[] {
  const teamToMgr = buildTeamToManagerMap(managers)
  const managerIds = managers.map((m) => m.id)
  if (managerIds.length === 0 || matches.length === 0) return []

  const byMd = new Map<number, ValidatedMatchRow[]>()
  for (const row of matches) {
    const md = row.matchday_number
    if (!byMd.has(md)) byMd.set(md, [])
    byMd.get(md)!.push(row)
  }
  const sortedMds = [...byMd.keys()].sort((a, b) => a - b)

  const agg = new Map<string, AggState>()
  for (const id of managerIds) agg.set(id, emptyAgg())

  const out: StandingsHistoryWithManager[] = []

  for (const md of sortedMds) {
    const mdMatches = byMd.get(md)!.slice().sort((a, b) => {
      if (a.home_team_id !== b.home_team_id) return a.home_team_id.localeCompare(b.home_team_id)
      return a.away_team_id.localeCompare(b.away_team_id)
    })

    for (const row of mdMatches) {
      const hm = teamToMgr.get(row.home_team_id)!
      const am = teamToMgr.get(row.away_team_id)!
      const hs = row.home_score
      const as = row.away_score

      const home = agg.get(hm)!
      const away = agg.get(am)!
      home.gf += hs
      home.ga += as
      away.gf += as
      away.ga += hs
      home.played++
      away.played++

      if (hs > as) {
        recordResult(home, "W")
        recordResult(away, "L")
      } else if (hs < as) {
        recordResult(home, "L")
        recordResult(away, "W")
      } else {
        recordResult(home, "D")
        recordResult(away, "D")
      }
    }

    const ranks = rankManagers(managerIds, agg)

    for (const mgrId of managerIds) {
      const state = agg.get(mgrId)!
      const { win, lose } = streaksFromResults(state.results)
      const mgr = managers.find((m) => m.id === mgrId)
      out.push({
        id: `computed-${seasonId}-j${md}-${mgrId}`,
        season_id: seasonId,
        manager_id: mgrId,
        matchday_number: md,
        rank: ranks.get(mgrId) ?? managerIds.length,
        points: state.points,
        goals_for: state.gf,
        goals_against: state.ga,
        form: formString(state.results) || null,
        matches_played: state.played,
        win_streak: win > 0 ? win : null,
        lose_streak: lose > 0 ? lose : null,
        created_at: null,
        manager: mgr,
      })
    }
  }

  return out
}

/** Dernière journée présente dans les matchs validés (storytelling / hero). */
export function maxMatchdayFromMatches(matches: ValidatedMatchRow[]): number {
  let m = 0
  for (const row of matches) {
    if (Number.isFinite(row.matchday_number) && row.matchday_number > m) m = row.matchday_number
  }
  return m
}
