import type { MatchResult } from "@/lib/types"

export type SeasonLaunchStory = {
  category: string
  title: string
  text: string
  href?: string
  cta?: string
}

export type SeasonLaunchMovement = {
  label: string
  teams: string[]
  text: string
}

export type SeasonLaunchEditorial = {
  eyebrow: string
  headline: string
  dek: string
  heroAside: {
    eyebrow: string
    title: string
    text: string
  }
  stories: SeasonLaunchStory[]
  movements: SeasonLaunchMovement[]
}

export const seasonLaunchEditorial: Record<string, SeasonLaunchEditorial> = {
  jakattak_ligue1: {
    eyebrow: "SAISON 2026-2027 · PART 1",
    headline: "LA CHASSE EST OUVERTE.",
    dek: "Les compteurs sont remis à zéro. Les certitudes aussi.",
    heroAside: {
      eyebrow: "CHAMPION À BATTRE",
      title: "GOLDEN ROOSTERS",
      text: "La couronne est remise en jeu.",
    },
    stories: [
      {
        category: "À LA UNE",
        title: "Dans la tête du champion",
        text:
          "Six titres, quelques ennemis et aucune envie de faire profil bas. L'entraîneur Seb ouvre les portes de son règne à La Gazzatak.",
        href: "/ligue/jakattak_ligue1/articles/dans-la-tete-du-champion",
        cta: "LIRE L'INTERVIEW",
      },
      {
        category: "RIVALITÉ",
        title: "Affaire de famille",
        text:
          "Chez les Rolando, le championnat se joue aussi en famille. Cette saison devra encore déterminer lequel des frères prendra l'ascendant sur l'autre.",
      },
    ],
    movements: [
      {
        label: "↑ BIENVENUE DANS L'ÉLITE",
        teams: ["JPP", "Filou FC"],
        text: "Ils ont gagné leur ticket. Reste maintenant à survivre à l'étage supérieur.",
      },
    ],
  },
  jakattak_ligue2: {
    eyebrow: "SAISON 2026-2027 · PART 1",
    headline: "TOUT LE MONDE VEUT MONTER.",
    dek: "JPP et Filou FC ont quitté les lieux. Une nouvelle course à l'élite commence.",
    heroAside: {
      eyebrow: "OBJECTIF",
      title: "LIGUE 1",
      text: "Deux places. Beaucoup trop de candidats.",
    },
    stories: [
      {
        category: "RIVALITÉ",
        title: "La revanche des recalés",
        text:
          "La Ligue 2 ouvre une nouvelle chasse : moins de lumière, autant d'ego, et la même obsession de remonter à l'étage supérieur.",
      },
      {
        category: "À SUIVRE",
        title: "Bab peut-il encore retrouver l'élite ?",
        text:
          "Les saisons passent et la Ligue 1 reste hors de portée. L'entraîneur Bab peut-il encore espérer retrouver l'élite ? #AJamaisLePremier",
      },
    ],
    movements: [
      {
        label: "↓ RETOUR À L'ÉTAGE INFÉRIEUR",
        teams: ["Olympique 2 Marseille", "Celtic Gossbo"],
        text: "La Ligue 1 est derrière eux. Il faut maintenant trouver le chemin du retour.",
      },
    ],
  },
}

export function getSeasonLaunchEditorial(leagueSlug: string): SeasonLaunchEditorial {
  return seasonLaunchEditorial[leagueSlug] ?? seasonLaunchEditorial.jakattak_ligue1
}

export function matchHasCompleteScore(match: Pick<MatchResult, "home_score" | "away_score">): boolean {
  return match.home_score != null && match.away_score != null
}
