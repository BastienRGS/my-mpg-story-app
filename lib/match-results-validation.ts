import type { ManagerWithTeam, MatchResult, ValidatedMatchRow } from "@/lib/types"

function rowRef(r: MatchResult, index1: string): string {
  const short = r.id ? ` (id ${r.id.slice(0, 8)}…)` : ""
  return `Ligne ${index1}${short}`
}

function missingScore(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "")
}

/**
 * Validation stricte des lignes `matches` avant calcul du classement.
 * Aucune ligne n’est acceptée tant qu’une erreur subsiste (pas de mélange valide / invalide).
 *
 * @see `ValidatedMatchRow` — seules ces lignes alimentent `computeStandingsHistoryFromMatches`.
 */
export function validateSeasonMatchResults(
  managers: ManagerWithTeam[],
  matchResults: MatchResult[]
): { issues: string[]; validRows: ValidatedMatchRow[] } {
  const issues: string[] = []

  if (matchResults.length === 0) {
    return { issues: [], validRows: [] }
  }

  if (managers.length === 0) {
    return {
      issues: [
        "Aucun manager pour cette ligue : impossible d’associer les équipes aux résultats.",
      ],
      validRows: [],
    }
  }

  const teamToMgr = new Map<string, string>()
  for (const m of managers) {
    if (m.team?.id) teamToMgr.set(m.team.id, m.id)
  }

  if (teamToMgr.size === 0) {
    return {
      issues: [
        "Aucune équipe (`teams`) liée aux managers pour cette saison. Créez les équipes avant de saisir les matchs.",
      ],
      validRows: [],
    }
  }

  const keyCount = new Map<string, number>()

  for (let i = 0; i < matchResults.length; i++) {
    const r = matchResults[i]
    const label = rowRef(r, String(i + 1))

    if (!String(r.matchday_id ?? "").trim()) {
      issues.push(
        `${label} : matchday_id manquant — chaque ligne de « matches » doit référencer « matchdays ».`
      )
    }

    const mdRaw = r.matchday_number
    const md = Number(mdRaw)
    if (String(r.matchday_id ?? "").trim() && md === 0) {
      issues.push(
        `${label} : matchday_id inconnu pour cette saison (vérifiez que la journée existe dans « matchdays »).`
      )
    } else if (missingScore(mdRaw) || !Number.isInteger(md) || md < 1) {
      issues.push(`${label} : numéro de journée invalide (${String(mdRaw)}).`)
    }

    const home = String(r.home_team_id ?? "").trim()
    const away = String(r.away_team_id ?? "").trim()
    if (!home) issues.push(`${label} : équipe domicile manquante.`)
    if (!away) issues.push(`${label} : équipe extérieur manquante.`)
    if (home && away && home === away) {
      issues.push(`${label} : domicile et extérieur identiques.`)
    }

    if (missingScore(r.home_score)) issues.push(`${label} : score domicile manquant.`)
    if (missingScore(r.away_score)) issues.push(`${label} : score extérieur manquant.`)

    const hs = Number(r.home_score)
    const as = Number(r.away_score)
    if (!missingScore(r.home_score) && (!Number.isInteger(hs) || hs < 0)) {
      issues.push(`${label} : score domicile invalide (${String(r.home_score)}).`)
    }
    if (!missingScore(r.away_score) && (!Number.isInteger(as) || as < 0)) {
      issues.push(`${label} : score extérieur invalide (${String(r.away_score)}).`)
    }

    if (home && !teamToMgr.has(home)) {
      issues.push(`${label} : équipe domicile inconnue pour cette saison (id ${home.slice(0, 8)}…).`)
    }
    if (away && !teamToMgr.has(away)) {
      issues.push(`${label} : équipe extérieur inconnue pour cette saison (id ${away.slice(0, 8)}…).`)
    }

    if (Number.isInteger(md) && md >= 1 && home && away) {
      const key = `${md}|${home}|${away}`
      keyCount.set(key, (keyCount.get(key) ?? 0) + 1)
    }
  }

  for (let i = 0; i < matchResults.length; i++) {
    const r = matchResults[i]
    const md = Number(r.matchday_number)
    const home = String(r.home_team_id ?? "").trim()
    const away = String(r.away_team_id ?? "").trim()
    if (!Number.isInteger(md) || md < 1 || !home || !away) continue
    const key = `${md}|${home}|${away}`
    if ((keyCount.get(key) ?? 0) > 1) {
      issues.push(`${rowRef(r, String(i + 1))} : doublon (même journée et même paire domicile / extérieur).`)
    }
  }

  if (issues.length > 0) {
    return { issues, validRows: [] }
  }

  const validRows: ValidatedMatchRow[] = matchResults.map((r) => ({
    matchday_number: Number(r.matchday_number),
    home_team_id: String(r.home_team_id).trim(),
    away_team_id: String(r.away_team_id).trim(),
    home_score: Number(r.home_score),
    away_score: Number(r.away_score),
  }))

  return { issues: [], validRows }
}
