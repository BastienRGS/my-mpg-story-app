import type { BonusHighlightBlock } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  bonusHighlight: BonusHighlightBlock | null
  /** `dashboard` : carte « La synthèse » · `newspaper` : page épisode La Gazzattak */
  variant?: "dashboard" | "newspaper"
}

type VerdictKind = "genie" | "looser" | "chanceux"

/** Présentation uniquement : aligné sur les chaînes fixes de `getBonusNarrative` (lib/bonus-narrative.ts). */
function verdictFromHighlightEntry(narrative: string, bonusTypeLabel: string): VerdictKind {
  const t = narrative.toLowerCase()
  const label = bonusTypeLabel.toUpperCase()

  if (label === "MIROIR" || t.includes("miroir")) {
    if (t.includes("po po po") || t.includes("coup de maître") || t.includes("quel génie")) return "genie"
    if (t.includes("sauve un point in extremis") || t.includes("sauve un point")) return "chanceux"
    return "looser"
  }

  const looserSnippets = [
    "même zahia n'a pas réussi",
    "mais ses chèvres ont quand même réussi à perdre",
    "même en hackant le game",
    "ça ne passe pas",
    "c'est du grand n'importe quoi",
    "il a sorti la valise pour rien",
    "la valise est sortie, mais le but adverse reste",
    "looser !",
    "tonton pat' méritait mieux",
    "mcdo+ n'a pas suffi",
    "le capitaine ne joue pas",
    "même en sabotant les remplacements adverses",
  ]
  if (looserSnippets.some((s) => t.includes(s))) return "looser"

  const genieSnippets = [
    "zahia a tout donné",
    "vilain, vicieux, efficace",
    "un petit coup de pouce numérique",
    "tout pour l'attaque, rien pour la défense, et ça passe",
    "la valise sort au bon moment",
    "mcdo+ sur le bon joueur",
    "le brassard au bon joueur",
    "il a neutralisé le plan tactique",
  ]
  if (genieSnippets.some((s) => t.includes(s))) return "genie"

  return "looser"
}

const verdictPillClass: Record<VerdictKind, string> = {
  genie: "border border-[#3ddc8440] bg-[#0d2b1a] text-[#3ddc84]",
  looser: "border border-[#ff444440] bg-[#2a0a0a] text-[#ff4444]",
  chanceux: "border border-[#ffd70040] bg-[#1a1a0d] text-[#ffd700]",
}

const verdictLabelText: Record<VerdictKind, string> = {
  genie: "GÉNIE",
  looser: "LOOSER",
  chanceux: "CHANCEUX",
}

/**
 * Bloc narratif des bonus mis en avant (entre Héros du jour et Impact classement sur le dashboard).
 * Ne rend rien si aucun bonus « en avant ».
 */
export function MatchdayNarrativeBonusSection({ bonusHighlight, variant = "dashboard" }: Props) {
  if (!bonusHighlight || bonusHighlight.entries.length === 0) return null

  const paper = variant === "newspaper"

  return (
    <div className={cn("space-y-4", !paper && "border-t border-border/60 pt-5")}>
      <h3
        className={cn(
          "text-xs font-bold uppercase tracking-wide",
          paper
            ? "section-label border-l-4 pl-3 font-extrabold"
            : "text-muted-foreground"
        )}
        style={paper ? { borderColor: "#3ddc84" } : undefined}
      >
        🎰 {bonusHighlight.title}
      </h3>
      <div className="flex flex-col gap-2">
        {bonusHighlight.entries.map((e, idx) => {
          const verdict = verdictFromHighlightEntry(e.narrative, e.bonusTypeLabel)
          const pill = verdictPillClass[verdict]
          const verdictWord = verdictLabelText[verdict]

          return (
            <div
              key={`${e.coachName}-${e.bonusTypeLabel}-${idx}`}
              className="flex flex-col gap-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 md:flex-row md:items-stretch md:gap-0"
            >
              {/* Mobile : coach + badges en ligne · md+ : colonne gauche 1/3, coach puis badges empilés */}
              <div className="flex flex-row flex-wrap items-center gap-2 md:w-1/3 md:flex-col md:items-start md:justify-center md:gap-2 md:pr-4">
                <p className="text-sm font-bold uppercase tracking-wide text-foreground">{e.coachName}</p>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                    pill
                  )}
                >
                  {e.bonusTypeLabel}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                    pill
                  )}
                >
                  {verdictWord}
                </span>
              </div>

              <div
                className="hidden w-px shrink-0 self-stretch bg-[#2a2a2a] md:block"
                aria-hidden
              />

              <div className="h-px w-full shrink-0 bg-[#2a2a2a] md:hidden" aria-hidden />

              <div className="md:flex md:w-2/3 md:flex-col md:justify-center md:pl-4">
                <p
                  className={cn(
                    "whitespace-pre-line text-sm italic leading-[1.6]",
                    paper ? "text-muted-foreground" : "text-white"
                  )}
                >
                  {e.narrative}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
