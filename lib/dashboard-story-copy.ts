import { pickMatchOfRoundRow, type LeagueStoryKpi } from "@/lib/league-story-kpis"
import type { ManagerWithTeam, StandingsHistoryWithManager, ValidatedMatchRow } from "@/lib/types"

export type StoryTextSegment = { text: string; emphasize?: boolean }

function displayName(m: ManagerWithTeam): string {
  return m.team?.name || m.name
}

function latestMatchdayNumber(standingsHistory: StandingsHistoryWithManager[]): number | null {
  if (standingsHistory.length === 0) return null
  return Math.max(...standingsHistory.map((r) => r.matchday_number))
}

function emphasizeLastWords(sentence: string, wordCount: number): StoryTextSegment[] {
  const t = sentence.trim()
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length === 0) return [{ text: sentence }]
  const n = Math.min(wordCount, words.length)
  if (words.length <= n) return [{ text: t, emphasize: true }]
  const head = `${words.slice(0, -n).join(" ")} `
  const tail = words.slice(-n).join(" ")
  return [{ text: head }, { text: tail, emphasize: true }]
}

/** Titre saisi en base : accroche + derniers mots en vert (ou coupure — / ,). */
function segmentsFromMatchdayTitle(title: string): StoryTextSegment[] {
  const t = title.trim()
  const emDash = t.indexOf(" — ")
  if (emDash >= 0) {
    return [{ text: t.slice(0, emDash + 3) }, { text: t.slice(emDash + 3).trimStart(), emphasize: true }]
  }
  const comma = t.indexOf(",")
  if (comma >= 0 && comma < t.length - 2) {
    return [{ text: `${t.slice(0, comma + 1)} ` }, { text: t.slice(comma + 1).trimStart(), emphasize: true }]
  }
  return emphasizeLastWords(t, Math.min(3, t.split(/\s+/).length))
}

/** Titres du type « J5 » / « Journée 5 » ne doivent pas remplir le hero (le badge porte la J). */
function isBareMatchdayTitle(title: string, matchdayNumber: number): boolean {
  const t = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
  const n = matchdayNumber
  if (t === `j${n}`) return true
  if (t === `journee ${n}`) return true
  if (t === `journée ${n}`) return true
  if (/^j\s*\d+$/.test(t.replace(/\s/g, ""))) {
    const d = parseInt(t.replace(/\D/g, ""), 10)
    return d === n
  }
  if (/^journee\s+\d+$/.test(t) || /^journée\s+\d+$/.test(title.trim().toLowerCase())) {
    const d = parseInt(t.replace(/\D/g, ""), 10)
    return d === n
  }
  return false
}

function teamWonMatch(teamId: string, m: ValidatedMatchRow): boolean {
  if (m.home_team_id === teamId) return m.home_score > m.away_score
  if (m.away_team_id === teamId) return m.away_score > m.home_score
  return false
}

/**
 * Titre hero éditorial (le numéro de J est uniquement dans le badge au-dessus).
 * Logique : leader + victoire → reprend/consolide ; sinon match « phare » nul à gros score → chaos ; sinon fallback.
 */
export function buildEditorialHeadlineSegments(params: {
  leagueName: string
  matchdayNumber: number
  matchdayTitle: string | null | undefined
  managers: ManagerWithTeam[]
  standingsHistory: StandingsHistoryWithManager[]
  validatedMatchRows: ValidatedMatchRow[]
}): StoryTextSegment[] {
  const { leagueName, matchdayNumber, matchdayTitle, managers, standingsHistory, validatedMatchRows } = params

  const rankAt = (md: number, managerId: string): number | null => {
    const row = standingsHistory.find((r) => r.matchday_number === md && r.manager_id === managerId)
    return row?.rank ?? null
  }

  const rowsForMd = standingsHistory.filter((r) => r.matchday_number === matchdayNumber)
  const dayMatches = validatedMatchRows.filter((r) => r.matchday_number === matchdayNumber)
  const hasComputedData = rowsForMd.length > 0 && dayMatches.length > 0

  if (hasComputedData) {
    const leaderRow = rowsForMd.find((r) => r.rank === 1)
    const leaderMgr = leaderRow ? managers.find((m) => m.id === leaderRow.manager_id) : undefined
    const teamId = leaderMgr?.team?.id
    const team = leaderMgr ? displayName(leaderMgr) : ""

    const matchdays = [...new Set(standingsHistory.map((r) => r.matchday_number))].sort((a, b) => a - b)
    const idx = matchdays.indexOf(matchdayNumber)
    const prevMd = idx > 0 ? matchdays[idx - 1]! : null

    const leaderMatch =
      teamId != null ? dayMatches.find((m) => m.home_team_id === teamId || m.away_team_id === teamId) : undefined

    const leaderWon = teamId != null && leaderMatch != null ? teamWonMatch(teamId, leaderMatch) : false

    if (leaderRow && leaderMgr && team && leaderWon) {
      const rPrev = prevMd != null ? rankAt(prevMd, leaderRow.manager_id) : null
      if (rPrev == null || rPrev > 1) {
        return [{ text: `${team} reprend le ` }, { text: "trône", emphasize: true }]
      }
      return [{ text: `${team} consolide le ` }, { text: "trône", emphasize: true }]
    }

    const motw = pickMatchOfRoundRow(validatedMatchRows, matchdayNumber)
    if (motw && motw.home_score === motw.away_score) {
      const total = motw.home_score + motw.away_score
      if (total >= 6) {
        return [{ text: "Le " }, { text: "chaos", emphasize: true }, { text: " au sommet" }]
      }
    }

    return [
      { text: `Journée ${matchdayNumber} : le ` },
      { text: "championnat", emphasize: true },
      { text: " se décide" },
    ]
  }

  if (matchdayTitle?.trim() && !isBareMatchdayTitle(matchdayTitle, matchdayNumber)) {
    return segmentsFromMatchdayTitle(matchdayTitle.trim())
  }

  if (standingsHistory.length === 0) {
    return [
      { text: `${leagueName} `, emphasize: true },
      { text: "attend le coup d’envoi — ", emphasize: false },
      { text: "l’histoire commence ici", emphasize: true },
      { text: ".", emphasize: false },
    ]
  }

  return [
    { text: `Journée ${matchdayNumber} : le ` },
    { text: "championnat", emphasize: true },
    { text: " se décide" },
  ]
}

export function buildDashboardSynthesisParagraphs(params: {
  managers: ManagerWithTeam[]
  standingsHistory: StandingsHistoryWithManager[]
  matchdayNumber: number
  leaderStrip: LeagueStoryKpi
  formBest: LeagueStoryKpi
}): [StoryTextSegment[], StoryTextSegment[]] {
  const {
    managers,
    standingsHistory,
    matchdayNumber,
    leaderStrip,
    formBest,
  } = params

  const rows = standingsHistory.filter((r) => r.matchday_number === matchdayNumber)
  const sorted = [...rows].sort((a, b) => a.rank - b.rank)
  const leaderRow = sorted[0]
  const second = sorted[1]
  const leaderMgrP1 = leaderRow ? managers.find((m) => m.id === leaderRow.manager_id) : undefined
  const secondMgr = second ? managers.find((m) => m.id === second.manager_id) : undefined
  const leaderName = leaderMgrP1 ? displayName(leaderMgrP1) : "Le leader"
  const secondName = secondMgr ? displayName(secondMgr) : "le dauphin"

  const p1: StoryTextSegment[] = []
  if (leaderStrip.hasData) {
    p1.push({ text: "En tête, " }, { text: leaderStrip.teamLabel, emphasize: true })
    p1.push({ text: ` compte ${leaderRow?.points ?? 0} points après la J${matchdayNumber}. ` })
    if (second && leaderRow) {
      const gap = (leaderRow.points ?? 0) - (second.points ?? 0)
      p1.push(
        { text: secondName, emphasize: true },
        {
          text:
            gap <= 0
              ? " colle au classement."
              : ` talonne avec ${gap} point${gap > 1 ? "s" : ""} de retard — la moindre erreur peut coûter cher.`,
        }
      )
    } else {
      p1.push({ text: "Le peloton est prévenu." })
    }
  } else {
    p1.push({
      text: `La J${matchdayNumber} laisse le haut du tableau ouvert : le récit du titre se joue dans les prochaines rencontres.`,
    })
  }

  const p2: StoryTextSegment[] = []
  if (formBest.hasData) {
    p2.push(
      { text: "Côté momentum, " },
      { text: formBest.teamLabel, emphasize: true },
      { text: ` porte la forme la plus tranchante. ${formBest.detail}` }
    )
  } else {
    p2.push({
      text: "Les séries de résultats vont bientôt dessiner les coaches en vue — il manque encore un peu de matière pour crier victoire.",
    })
  }

  return [p1, p2]
}
