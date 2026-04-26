/**
 * Bible narrative JAKATTAK Multiligue — textes et repères factuels pour enrichir les récits auto.
 * Pure TypeScript, sans dépendance externe.
 */

export type PalmarèsEntry = {
  season: number
  l1Winner: string
  l1Relegated: string[]
  l2Winner: string
  l2Promoted: string[]
}

/** Palmarès L1/L2 par saison (canon interne pour l’historique). */
export const PALMARES: PalmarèsEntry[] = [
  {
    season: 1,
    l1Winner: "Bab Olympique",
    l1Relegated: ["Dontoto", "Deepblue"],
    l2Winner: "Hbaman",
    l2Promoted: ["Hbaman", "Celtic Gossbo"],
  },
  {
    season: 2,
    l1Winner: "Jakattak",
    l1Relegated: ["Hbaman", "Fc Jux"],
    l2Winner: "Golden Roosters",
    l2Promoted: ["Golden Roosters", "Alex"],
  },
  {
    season: 3,
    l1Winner: "Golden Roosters",
    l1Relegated: ["Pisse à la raie", "Bab Olympique"],
    l2Winner: "Truelles",
    l2Promoted: ["Truelles", "Les pieds cassés"],
  },
  {
    season: 4,
    l1Winner: "Mat FC",
    l1Relegated: ["Truelles", "Yammoudia 13"],
    l2Winner: "OMT",
    l2Promoted: ["OMT", "Olympique Mars 13"],
  },
  {
    season: 5,
    l1Winner: "Golden Roosters",
    l1Relegated: ["Celtic Gossbo", "Imposteur Foot Club"],
    l2Winner: "Paris Aligo",
    l2Promoted: ["Paris Aligo", "Couscous"],
  },
  {
    season: 6,
    l1Winner: "Golden Roosters",
    l1Relegated: ["Red Star", "Juventini"],
    l2Winner: "Deepblue",
    l2Promoted: ["Deepblue", "Madeinviet"],
  },
  {
    season: 7,
    l1Winner: "Golden Roosters",
    l1Relegated: ["Jakattak", "Olympique 2 Marseille"],
    l2Winner: "Celtic Gossbo",
    l2Promoted: ["Celtic Gossbo", "Carnoux City"],
  },
  {
    season: 8,
    l1Winner: "Madeinviet",
    l1Relegated: ["Deepblue", "OMT"],
    l2Winner: "Jakattak",
    l2Promoted: ["Jakattak", "Olympik 2 Marseille"],
  },
  {
    season: 9,
    l1Winner: "Golden Roosters",
    l1Relegated: ["Madeinviet", "PLR"],
    l2Winner: "Red Star",
    l2Promoted: ["Red Star", "OMT"],
  },
]

/** Angles narratifs (référence documentaire ; injection via helpers). */
export const RIVALRIES_AND_LORE = {
  MAFIA_ROLANDESE: {
    summary:
      "Jakattak a fondé la ligue (toujours coach actif). Golden Roosters est dirigé par son frère. Cinq titres L1 (S3, S5, S6, S7, S9). Victoire des Roosters : la Mafia Rolandèse ; défaite : anomalie rare.",
  },
  BAB_OLYMPIQUE_LEGEND: {
    summary:
      "Premier champion L1 (S1), relégué en S3, jamais revenu en L1 — L2 en S10. Première couronne, puis purgatoire saison après saison.",
  },
  JAKATTAK_FOUNDER: {
    summary:
      "Fondateur relégué en S7, remontée depuis la L2 en S8, de retour en L1 en S10 pour reconquérir son trône.",
  },
  GOLDEN_ROOSTERS_DYNASTY: {
    summary:
      "Cinq sacres L1, force dominante : chaque journée pose la question « qui arrête la dynastie ? ».",
  },
  YO_YO_CLUBS: {
    Deepblue: "S1 descente, remontée S6, S8 retour en bas — aujourd’hui en L2.",
    Madinviet: "Montée S6, titre L1 en S8, descente S9 — le champion déchu, en L2.",
    CelticGossbo:
      "Montée S1, descente S5, remontée S7 ; toujours en lice en L1 en S10 — le survivant.",
    OMT: "Montée S4, descente S8, retour S9 — de nouveau en L1.",
  },
  CURRENT_SEASON_10: {
    ligue1: [
      "Fc Goudal",
      "Red Star",
      "OMT",
      "Jakattak",
      "Mat FC",
      "Celtic Gossbo",
      "Golden Roosters",
      "Olympik 2 Marseille",
    ],
    ligue2: [
      "Deepblue",
      "Bab Olympique",
      "Filou FC",
      "JPP",
      "PLR",
      "Rocket Team",
      "Souvlaki",
      "Madinviet",
    ],
  },
} as const

const GOLDEN_ROOSTERS_L1_TITLES = 5

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "")
}

/** Normalise pour comparaisons insensibles à la casse / accents / espaces. */
export function normalizeTeamName(raw: string): string {
  let s = stripDiacritics(raw.trim().toLowerCase())
  s = s.replace(/['’]/g, "")
  s = s.replace(/\s+/g, " ")
  // Variantes orthographiques fréquentes
  if (s === "madinviet" || s.includes("mad in viet")) s = "madeinviet"
  if (s === "madeinviet" || s.includes("made in viet")) s = "madeinviet"
  if (s.includes("olympique 2 marseille") || s.includes("olympik 2 marseille")) {
    s = s.replace(/olympique 2 marseille/g, "olympik 2 marseille")
  }
  return s
}

type TeamKey =
  | "jakattak"
  | "golden_roosters"
  | "bab_olympique"
  | "deepblue"
  | "madeinviet"
  | "celtic_gossbo"
  | "omt"
  | "mat_fc"
  | "fc_goudal"
  | "red_star"
  | "plr"
  | "olympik2"

const TEAM_RESOLVERS: { key: TeamKey; needles: string[] }[] = [
  { key: "golden_roosters", needles: ["golden roosters", "goldenroosters"] },
  { key: "jakattak", needles: ["jakattak"] },
  { key: "bab_olympique", needles: ["bab olympique", "babolympique"] },
  { key: "madeinviet", needles: ["madeinviet", "madinviet"] },
  { key: "celtic_gossbo", needles: ["celtic gossbo", "celticgossbo"] },
  { key: "olympik2", needles: ["olympik 2 marseille", "olympique 2 marseille"] },
  { key: "mat_fc", needles: ["mat fc", "matfc"] },
  { key: "fc_goudal", needles: ["fc goudal", "fcgoudal"] },
  { key: "red_star", needles: ["red star", "redstar"] },
  { key: "deepblue", needles: ["deepblue", "deep blue"] },
]

function resolveTeamKey(name: string): TeamKey | null {
  const n = normalizeTeamName(name)
  for (const { key, needles } of TEAM_RESOLVERS) {
    for (const needle of needles) {
      if (n === needle || n.includes(needle)) return key
    }
  }
  // Sigles courts : éviter les sous-chaînes accidentelles
  if (n === "omt" || /\bomt\b/.test(n)) return "omt"
  if (n === "plr" || /\bplr\b/.test(n)) return "plr"
  if (n.includes("goudal")) return "fc_goudal"
  return null
}

function pairKeys(a: string, b: string): { ha: TeamKey | null; aw: TeamKey | null } {
  return { ha: resolveTeamKey(a), aw: resolveTeamKey(b) }
}

function hasKeys(ha: TeamKey | null, aw: TeamKey | null, x: TeamKey, y: TeamKey): boolean {
  if (!ha || !aw) return false
  return (ha === x && aw === y) || (ha === y && aw === x)
}

/**
 * Accroche narrative pour une paire d’équipes (sans score).
 * Ordre home/away ignoré pour les duels symétriques.
 */
export function getLoreForMatch(homeTeam: string, awayTeam: string): string | null {
  const { ha, aw } = pairKeys(homeTeam, awayTeam)
  if (ha && aw && hasKeys(ha, aw, "jakattak", "golden_roosters")) {
    return (
      "Derby familial — le fondateur affronte la Mafia Rolandèse. Jakattak, créateur de cette ligue, croise le club de son frère : " +
      "certains crient à la mise en scène, d’autres à un règlement de comptes à la maison."
    )
  }
  if (ha && aw && hasKeys(ha, aw, "bab_olympique", "jakattak")) {
    return "Le premier roi contre le fondateur : Bab Olympique, légende déchue, défie celui qui a tout lancé."
  }
  if (ha && aw && hasKeys(ha, aw, "golden_roosters", "madeinviet")) {
    return "La dynastie face au champion déchu : Madeinviet veut prouver que le titre de 2024 n’était pas un accident."
  }
  if (ha && aw && hasKeys(ha, aw, "golden_roosters", "mat_fc")) {
    return "Mat FC, dernier « autre » champion en date, tente de freiner la machine Golden Roosters."
  }
  if (ha && aw && hasKeys(ha, aw, "deepblue", "omt")) {
    return "Deux clubs au yo-yo : Deepblue et OMT se retrouvent avec des dossiers de montées et descentes bien remplis."
  }
  if (ha && aw && hasKeys(ha, aw, "celtic_gossbo", "golden_roosters")) {
    return "Le survivant des divisions croise la Mafia Rolandèse : Celtic Gossbo n’a jamais dit son dernier mot."
  }
  if (ha && aw && hasKeys(ha, aw, "bab_olympique", "golden_roosters")) {
    return "Le premier champion contre la dynastie : entre nostalgie et présent qui écrase tout."
  }
  return null
}

const COACH_LORE_TAG: Partial<Record<TeamKey, string>> = {
  golden_roosters: "Mafia Rolandèse",
  jakattak: "Fondateur en quête de trône",
  bab_olympique: "Légende déchue",
  madeinviet: "Champion déchu",
  deepblue: "Club yo-yo",
  celtic_gossbo: "Le survivant",
  omt: "Rebondisseur",
  mat_fc: "Dernier outsider sacré",
}

/** Tag principal pour cartes / sous-titres (une ligne). */
export function getLoreForCoach(teamName: string): string | null {
  const key = resolveTeamKey(teamName)
  if (!key) return null
  return COACH_LORE_TAG[key] ?? null
}

/** Phrase courte pour enrichir un KPI quand l’équipe mise en avant a une ligne d’accent. */
export function getLoreKpiAccent(
  teamName: string,
  slug: "hot_coach" | "crisis_coach" | "match_of_round" | "comeback"
): string | null {
  const key = resolveTeamKey(teamName)
  if (key === "golden_roosters") {
    if (slug === "hot_coach") {
      return `La Mafia Rolandèse frappe encore : ${GOLDEN_ROOSTERS_L1_TITLES} titres L1, une domination qui interroge. Coïncidence ?`
    }
    if (slug === "crisis_coach") {
      return "Anomalie signalée : même la Mafia Rolandèse peut vaciller une semaine."
    }
    if (slug === "match_of_round") {
      return "Le choc attire les projecteurs sur la Maison la plus titrée de la ligue."
    }
  }
  if (key === "jakattak" && slug === "hot_coach") {
    return "Le fondateur reprend de la hauteur : le trône n’a jamais été aussi proche psychologiquement."
  }
  if (key === "bab_olympique" && (slug === "hot_coach" || slug === "comeback")) {
    return "Bab Olympique réécrit peut-être enfin une page après trop de saisons en purgatoire."
  }
  if (key === "madeinviet" && slug === "hot_coach") {
    return "Madeinviet veut effacer l’ombre du titre perdu et du relégable."
  }
  return null
}

export function getSeasonPalmarès(season: number): PalmarèsEntry | null {
  return PALMARES.find((p) => p.season === season) ?? null
}

/**
 * Légende sous un score : rivalités, ou saveur Mafia / anomalie si Golden Roosters joue.
 */
export function getScorelineLoreCaption(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): string | null {
  const hook = getLoreForMatch(homeTeam, awayTeam)
  const hk = resolveTeamKey(homeTeam)
  const ak = resolveTeamKey(awayTeam)
  const grHome = hk === "golden_roosters"
  const grAway = ak === "golden_roosters"
  let extra: string | null = null
  if (grHome || grAway) {
    const grWon = grHome ? homeScore > awayScore : awayScore > homeScore
    const grLost = grHome ? homeScore < awayScore : awayScore < homeScore
    if (grWon) {
      extra = "La Mafia Rolandèse valide ce résultat."
    } else if (grLost) {
      extra = "Anomalie rare : la Mafia Rolandèse a tremblé ce soir-là."
    } else {
      extra = "La Mafia Rolandèse doit partager les points — scénario inhabituel."
    }
  }
  if (hook && extra) {
    return `${hook} ${extra}`
  }
  return hook ?? extra
}

/** True si Golden Roosters a gagné au moins un match sur la liste (scores numériques). */
export function goldenRoostersWonAny(
  rows: { homeName: string; awayName: string; homeScore: number; awayScore: number }[]
): boolean {
  for (const r of rows) {
    const hk = resolveTeamKey(r.homeName)
    const ak = resolveTeamKey(r.awayName)
    if (hk === "golden_roosters" && r.homeScore > r.awayScore) return true
    if (ak === "golden_roosters" && r.awayScore > r.homeScore) return true
  }
  return false
}
