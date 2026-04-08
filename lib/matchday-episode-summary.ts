import type { LeagueStoryKpi } from "@/lib/league-story-kpis"
import type { ManagerWithTeam, StandingsHistoryWithManager, ValidatedMatchRow } from "@/lib/types"

function displayName(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

/**
 * Texte de synthèse auto à partir des KPIs et du classement après la journée.
 */
export function buildAutomaticMatchdaySummary(params: {
  leagueName: string
  matchdayNumber: number
  managerOfWeek: LeagueStoryKpi
  matchOfWeek: LeagueStoryKpi
  standingsAfter: StandingsHistoryWithManager[]
  managers: ManagerWithTeam[]
  validatedRowsForDay: ValidatedMatchRow[]
}): string {
  const { leagueName, matchdayNumber, managerOfWeek, matchOfWeek, standingsAfter, managers, validatedRowsForDay } =
    params

  const n = validatedRowsForDay.length
  const totalGoals = validatedRowsForDay.reduce((s, m) => s + m.home_score + m.away_score, 0)

  const intro =
    n === 0
      ? `J${matchdayNumber} — ${leagueName} : aucun résultat enregistré pour cette journée pour l’instant.`
      : `J${matchdayNumber} — ${leagueName} : ${n} rencontre${n > 1 ? "s" : ""}, ${totalGoals} but${totalGoals > 1 ? "s" : ""} au total.`

  const bits: string[] = [intro]

  if (managerOfWeek.hasData) {
    bits.push(
      `${managerOfWeek.teamLabel} (${managerOfWeek.managerName}) : ${managerOfWeek.detail.replace(/\.$/, "")}.`
    )
  }

  if (matchOfWeek.hasData) {
    bits.push(`${matchOfWeek.managerName} — ${matchOfWeek.detail.replace(/\.$/, "")}.`)
  }

  if (standingsAfter.length > 0) {
    const leader = standingsAfter.find((r) => r.rank === 1)
    if (leader) {
      const mgr = managers.find((m) => m.id === leader.manager_id)
      const label = mgr ? displayName(mgr) : "—"
      const pts = leader.points ?? 0
      bits.push(`Après cette journée, ${label} mène le classement avec ${pts} point${pts > 1 ? "s" : ""}.`)
    }
  }

  return bits.join(" ")
}
