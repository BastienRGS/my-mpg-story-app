/**
 * Chart comparison: "you" + up to 3 others (`useStandingsComparisonSelection`).
 *
 * MVP env (no auth): `NEXT_PUBLIC_MY_MANAGER_ID` = Supabase `managers.id` for the default "Vous" line.
 * Browser: `fair-route:viewer-manager-id[:leagueId]`, `fair-route:compare-manager-ids[:leagueId]`.
 */

export const VIEWER_MANAGER_ID_KEY = "fair-route:viewer-manager-id"
export const COMPARE_MANAGER_IDS_KEY = "fair-route:compare-manager-ids"

function viewerStorageKey(leagueId?: string | null) {
  return leagueId ? `${VIEWER_MANAGER_ID_KEY}:${leagueId}` : VIEWER_MANAGER_ID_KEY
}

function compareStorageKey(leagueId?: string | null) {
  return leagueId ? `${COMPARE_MANAGER_IDS_KEY}:${leagueId}` : COMPARE_MANAGER_IDS_KEY
}

export type StandingRowForComparison = {
  manager_id: string
  matchday_number: number
  rank: number
}

export function readViewerManagerId(leagueId?: string | null): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(viewerStorageKey(leagueId))
  } catch {
    return null
  }
}

export function writeViewerManagerId(id: string, leagueId?: string | null) {
  try {
    localStorage.setItem(viewerStorageKey(leagueId), id)
  } catch {
    /* ignore */
  }
}

export function readCompareManagerIds(leagueId?: string | null): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(compareStorageKey(leagueId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

export function writeCompareManagerIds(ids: string[], leagueId?: string | null) {
  try {
    localStorage.setItem(compareStorageKey(leagueId), JSON.stringify(ids.slice(0, 3)))
  } catch {
    /* ignore */
  }
}

/** Stable Recharts series key per manager (avoids duplicate team labels). */
export function chartLineKey(managerId: string): string {
  return `mgr_${managerId}`
}

function pickViewerFromStandingsRows(
  managerIds: string[],
  rows: StandingRowForComparison[]
): string {
  if (rows.length === 0) return managerIds[0]

  const latestMd = Math.max(...rows.map((r) => r.matchday_number))
  const latest = rows.filter((r) => r.matchday_number === latestMd)
  const leader = latest.find((r) => r.rank === 1)
  if (leader && managerIds.includes(leader.manager_id)) return leader.manager_id

  return managerIds[0]
}

/**
 * SSR-safe default viewer: env + classement uniquement (pas de `localStorage`).
 * Utiliser pour tout calcul pendant le rendu afin d’éviter les erreurs d’hydratation.
 */
export function resolveDefaultViewerManagerId(
  managerIds: string[],
  rows: StandingRowForComparison[],
  _leagueId?: string | null
): string | null {
  if (managerIds.length === 0) return null

  const envId =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MY_MANAGER_ID?.trim() : undefined
  if (envId && managerIds.includes(envId)) return envId

  return pickViewerFromStandingsRows(managerIds, rows)
}

/**
 * Résolution complète incluant la préférence navigateur. À n’appeler que depuis `useEffect`
 * (après hydratation), jamais pendant le rendu initial.
 */
export function resolveViewerManagerIdWithStoredPreference(
  managerIds: string[],
  rows: StandingRowForComparison[],
  leagueId?: string | null
): string | null {
  if (managerIds.length === 0) return null

  const envId =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_MY_MANAGER_ID?.trim() : undefined
  if (envId && managerIds.includes(envId)) return envId

  const stored = readViewerManagerId(leagueId)
  if (stored && managerIds.includes(stored)) return stored

  return pickViewerFromStandingsRows(managerIds, rows)
}
