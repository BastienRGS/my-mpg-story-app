import type { LeagueStoryKpi } from "@/lib/league-story-kpis"
import { getLoreForCoach } from "@/lib/league-lore"

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
