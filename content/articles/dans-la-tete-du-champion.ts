import type { EditorialArticle, EditorialTextSegment } from "@/lib/articles"

const p = (...content: EditorialTextSegment[]) => ({ type: "paragraph", content }) as const

const t = (text: string, strong = false) => ({ text, strong })

export const dansLaTeteDuChampion: EditorialArticle = {
  slug: "dans-la-tete-du-champion",
  leagueSlug: "jakattak_ligue1",
  category: "Interview",
  eyebrow: "L'ENTRETIEN DU CHAMPION",
  kicker: "LE GALACTIQUE · 6 TITRES EN LIGUE 1",
  title: "« Perdez pas votre temps... À la fin, c'est un Rolando qui gagne. »",
  excerpt:
    "Six titres, quelques ennemis et aucune envie de faire profil bas. L'entraîneur Seb ouvre les portes de son règne à La Gazzatak.",
  publishedAt: "2026-08-31",
  author: "La Gazzatak / La rédaction",
  heroImage: "/Seb.png",
  content: [
    p(
      t(
        "Alors que la nouvelle saison peine encore à remplir ses rangs, La Gazzatak est allée prendre des nouvelles de celui qui, lui, ne semble pas souffrir d'un manque de confiance."
      )
    ),
    p(
      t("Champion en titre, "),
      t("l'entraîneur Seb", true),
      t(
        " nous a reçus dans son hôtel particulier du 6e arrondissement de Paris. Le Galactique revient sur son sixième sacre, ses adversaires et ses méthodes. Et le moins qu'on puisse dire, c'est que la modestie n'était pas au programme."
      )
    ),
    { type: "heading", text: "DU TALENT ET DU TRAVAIL... CE QUI MANQUE À CERTAINS !" },
    p(
      t(
        "Pour expliquer son nouveau titre de Ligue 1, celui qu'on surnomme « Le Galactique » invoque son expérience du mercato et sa capacité à construire "
      ),
      t("« une équipe constante sur la durée »", true),
      t(".")
    ),
    p(
      t("L'entraîneur Seb croit en ses joueurs. Mais aussi en sa "),
      t("« bonne étoile »", true),
      t(". Il concède même un "),
      t("« alignement des planètes »", true),
      t(", ainsi que "),
      t("« ce petit plus »", true),
      t(" qui fait la marque des champions.")
    ),
    p(
      t(
        "Mais même avec les planètes correctement alignées, ce sixième titre n'a pas été une promenade de santé. Deux entraîneurs, notamment, ont poussé le champion jusque dans ses derniers retranchements."
      )
    ),
    { type: "heading", text: "RED STAR ET OMT, LES DEUX CAILLOUX DANS LA CHAUSSURE" },
    p(
      t("Interrogé sur ceux qui l'ont le plus fait douter, le champion cite "),
      t("l'entraîneur Ben et son Red Star", true),
      t(", ainsi que "),
      t("l'entraîneur Thomas avec OMT", true),
      t(".")
    ),
    p(
      t("Et pour cause : la victoire finale s'est jouée "),
      t("au goal-average lors de la dernière journée", true),
      t(". Deux adversaires qui ont réussi à pousser Le Galactique jusque dans ses derniers retranchements.")
    ),
    p(
      t(
        "Mais rivalité oblige, difficulté ne signifie pas forcément mauvais souvenir. ",
      ),
      t(
        "L'entraîneur Thomas fait justement partie de ceux que l'entraîneur Seb prend le plus de plaisir à battre. Tout comme son propre frère.",
        true
      ),
      t(
        " Chez les Rolando, manifestement, les repas de famille doivent être plus agréables après une victoire."
      )
    ),
    p(
      t(
        "Pour les autres, le diagnostic est moins flatteur. Interrogé notamment sur la qualité de sa défense, imperméable tout au long de la saison, le champion aurait pu parler de travail, de rigueur ou de maîtrise tactique. Mais il estime que ce sont surtout les autres entraîneurs qui ne sont pas à la hauteur :"
      )
    ),
    { type: "quote", text: "C'est des branleurs les mecs en face... Ils n'ont pas d'attaque." },
    p(t("Et pour "), t("Mat FC", true), t(", ça devient carrément l'humiliation : 2 rencontres, 2 victoires "), t("5-0 !", true)),
    { type: "quote", text: "Rencontrer Mat FC, c'est un vrai plaisir !" },
    p(t("À ce niveau-là, ce n'est plus un adversaire. "), t("C'est un sparring-partner.", true)),
    p(
      t(
        "Mais tous ses adversaires ne lui laissent pas d'aussi bons souvenirs. Il y en a même un dont le nom suffit à faire disparaître le sourire du champion."
      )
    ),
    { type: "heading", text: "CELTIC GOSSBO ? RENDEZ-VOUS DEVANT LA COMMISSION" },
    p(
      t("Quand La Gazzatak lui demande de désigner le coach le plus surcoté, "),
      t("l'entraîneur Seb", true),
      t(" n'hésite guère : "),
      t("l'entraîneur Benoît du Celtic Gossbo", true),
      t(".")
    ),
    p(
      t(
        "Le champion n'a visiblement toujours pas digéré les accusations de corruption lancées à l'encontre de la Ligue et sa dernière défaite contre l'entraîneur Benoît :"
      )
    ),
    {
      type: "quote",
      text:
        "Ce n'est pas du niveau d'un entraîneur de lancer ce genre d'accusations. Je réfléchis avec mes avocats à porter l'affaire devant la commission de la Ligue. En plus, il m'a mis 5-0 ce bâtard !",
    },
    p(t("Avant d'ajouter que le départ de l'entraîneur est peut-être la preuve qu'il aurait lui-même "), t("« des choses à se reprocher »", true), t(".")),
    p(t("La Gazzatak laisse ses lecteurs déterminer lequel de ces deux éléments motive réellement la procédure.")),
    p(
      t(
        "Une chose est certaine : l'entraîneur Benoît ne sera plus là cette saison pour défendre sa cause sur le terrain. Pendant que certains quittent la Ligue 1, deux nouveaux entraîneurs frappent justement à la porte de l'élite."
      )
    ),
    { type: "heading", text: "LES PROMUS ? « LA CHANCE DU DÉBUTANT »" },
    p(t("JPP et Filou FC arrivent en Ligue 1.", true)),
    p(t("Bienvenue dans l'élite.")),
    p(t("Mais n'attendez pas du champion qu'il déroule le tapis rouge :")),
    { type: "quote", text: "Ils peuvent avoir la chance du débutant. Mais ça ne dure jamais bien longtemps." },
    p(t("Le message est passé.")),
    p(t("L'entraîneur Seb profite même de l'occasion pour adresser un petit message à ceux qui quittent la compétition, débarqués par leurs présidents :")),
    { type: "quote", text: "Ils ne tiennent pas la pression. Bye bye !" },
    p(
      t(
        "Des départs, des arrivées et une Ligue 1 qui change de visage : pendant que certains font leurs valises, les autres préparent déjà leurs emplettes."
      )
    ),
    p(t("Et dans ce domaine, "), t("Le Galactique estime avoir quelques longueurs d'avance.", true)),
    { type: "heading", text: "80 % DE SCOUTING, 20 % DE CARNET D'ADRESSES" },
    p(t("Reste l'arme principale du Galactique : "), t("le mercato", true), t(".")),
    p(t("Et lorsqu'on lui demande sa recette, l'entraîneur Seb entrouvre les portes de sa cuisine :")),
    {
      type: "quote",
      text:
        "80 % de scouting, les recherches, le talent... et disons que j'ai mes relations. En quelques coups de fil, j'ai mes infos.",
    },
    p(t("Des recherches. Du talent. Des relations. Des coups de fil.")),
    p(t("Une recette sur laquelle La Gazzatak aura probablement l'occasion de revenir...", true)),
    p(
      t(
        "En attendant, une dernière question restait à poser au sextuple champion. Après six couronnes et alors qu'une nouvelle meute s'apprête à partir à sa chasse, "
      ),
      t("Le Galactique a-t-il encore quelque chose à prouver ?", true)
    ),
    p(t("À l'entendre, la question se poserait plutôt aux autres.")),
    { type: "heading", text: "« À LA FIN, C'EST UN ROLANDO QUI GAGNE »" },
    p(
      t(
        "Lorsqu'on lui demande de laisser un dernier message à toute la Ligue 1 avant le mercato, le champion abandonne définitivement toute tentative de modestie :"
      )
    ),
    {
      type: "quote",
      variant: "lead",
      text: "Perdez pas votre temps à faire un bon mercato. À la fin, c'est un Rolando qui gagne.",
    },
    p(t("Six titres de Ligue 1 plus tard, la problématique est assez simple :")),
    p(t("Pour pouvoir le faire taire, il va falloir que quelqu'un le fasse perdre.", true)),
  ],
}
