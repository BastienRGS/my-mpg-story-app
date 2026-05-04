/**
 * Textes narratifs bonus MPG — La Gazzattak (sources figées).
 */

export type BonusNarrativeKey = {
  bonus: string
  outcome: string
}

function normalizeBonusKey(bonus: string): string {
  return bonus.trim().toLowerCase()
}

function normalizeOutcomeKey(outcome: string): string {
  return outcome.trim().toLowerCase()
}

function applyCoachAndTeam(
  text: string,
  coachName: string,
  _teamName: string
): string {
  return text.replace(/\[coachName\]/g, coachName).replace(/\bLe coach\b/g, coachName)
}

/**
 * Récupère le texte narratif pour un couple bonus × résultat.
 * `coachName` / `teamName` personnalisent les mentions ; « ses chèvres » est volontairement conservé.
 */
export function getBonusNarrative(
  bonus: string,
  outcome: string,
  coachName: string,
  teamName: string
): string | null {
  const b = normalizeBonusKey(bonus)
  const o = normalizeOutcomeKey(outcome)

  let raw: string | null = null

  if (b === "zahia") {
    if (o === "win") {
      raw =
        "Zahia a tout donné pour ses joueurs.\nEt ses joueurs ont tout donné pour elle.\n3 points mérités, [coachName] avait le bon 06."
    } else if (o === "loss_or_draw") {
      raw =
        "Même Zahia n'a pas réussi à transcender ces chèvres.\nCertains sont imperméables à la motivation.\nLooser !"
    }
  } else if (b === "suarez") {
    if (o === "win") {
      raw =
        "Vilain, vicieux, efficace.\nLe Suarez a déstabilisé le gardien adverse\net ces petites chèvres en ont profité.\n[coachName] assume et a bien raison."
    } else if (o === "loss_or_draw") {
      raw =
        "Le Suarez a bien mordu le gardien adverse.\nMais ses chèvres ont quand même réussi à perdre !"
    }
  } else if (b === "cheat_code") {
    if (o === "win") {
      raw =
        "Un petit coup de pouce numérique pour 3 points bien réels.\nOn n'appelle pas ça tricher,\non appelle ça un petit arrangement."
    } else if (o === "loss_or_draw") {
      raw =
        "Même en hackant le game, ses chèvres ont trouvé\nle moyen de ne pas gagner.\nLe Cheat Code ne couvre pas la nullité !"
    }
  } else if (b === "4decat") {
    if (o === "win") {
      raw =
        "Tout pour l'attaque, rien pour la défense, et ça passe !\n[coachName] a tenté le tout pour le tout.\nCulotté. Efficace. Chapeau."
    } else if (o === "loss_or_draw") {
      raw =
        "Tout pour l'attaque, rien pour la défense, et ça ne passe pas.\nCes chèvres en 4-2-4, c'est du grand n'importe quoi."
    }
  } else if (b === "miroir") {
    if (o === "mirror_wasted") {
      raw =
        "Le miroir pour rien.\nL'adversaire n'avait rien mis et lui a quand même perdu son bonus.\nStratège du dimanche."
    } else if (o === "mirror_genius") {
      raw =
        "Po po po. Il retourne la valise de son adversaire comme un grand.\nCoup de maître, 3 points volés à son adversaire.\nQuel génie !"
    } else if (o === "mirror_draw") {
      raw =
        "Le miroir sauve un point in extremis.\nUn grand ouf dans le vestiaire.\nOn prend et on remercie."
    }
  } else if (b === "tonton_pat") {
    if (o === "win") {
      raw =
        "Il a neutralisé le plan tactique adverse\navant même qu'il ne se mette en place.\n[coachName] lit le jeu. Les autres subissent."
    } else if (o === "loss_or_draw") {
      raw =
        "Même en sabotant les remplacements adverses,\nses chèvres n'ont pas réussi à s'imposer.\nTonton Pat' méritait mieux que ça."
    }
  } else if (b === "valise_nanard") {
    if (o === "win") {
      raw =
        "La valise sort au bon moment et annule le but adverse.\n3 points. 5M dépensés.\nL'investissement du mois."
    } else if (o === "no_goal_to_cancel") {
      raw =
        "Il a sorti la valise pour rien.\nPas de but à annuler, 5M envolés,\net la défaite en prime. Looser !"
    } else if (o === "loss_or_draw") {
      raw =
        "La valise est sortie, mais le but adverse reste.\nPas assez fort pour renverser le match.\n5M dépensés pour pas grand-chose."
    }
  } else if (b === "mcdo_plus") {
    if (o === "win") {
      raw =
        "Le McDo+ sur le bon joueur, au bon moment.\n[coachName] a l'œil. 1 point de plus qui change tout.\nStratège."
    } else if (o === "loss_or_draw") {
      raw =
        "Le McDo+ n'a pas suffi à nourrir\nces chèvres affamées de victoire.\nMême avec le boost, rien."
    }
  } else if (b === "capitaine") {
    if (o === "win") {
      raw =
        "Le brassard au bon joueur, la victoire au bout.\n[coachName] connaît ses joueurs. Ou il a eu de la chance.\nLes deux, probablement."
    } else if (o === "loss_or_draw") {
      raw =
        "Le capitaine ne joue pas. Le bonus est perdu.\nLa victoire aussi.\nProchaine fois, vérifie la compo adverse."
    }
  }

  if (raw == null) return null
  return applyCoachAndTeam(raw, coachName, teamName)
}
