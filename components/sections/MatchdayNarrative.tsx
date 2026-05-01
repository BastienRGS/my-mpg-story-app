import type { BonusHighlightBlock } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  bonusHighlight: BonusHighlightBlock | null
  /** `dashboard` : carte « La synthèse » · `newspaper` : page épisode La Gazzattak */
  variant?: "dashboard" | "newspaper"
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
        {bonusHighlight.title}
      </h3>
      <div className="space-y-0">
        {bonusHighlight.entries.map((e, idx) => (
          <div
            key={`${e.coachName}-${e.bonusTypeLabel}-${idx}`}
            className={cn(
              idx > 0 && "mt-6 border-t pt-6",
              paper ? "border-white/10" : "border-border/60"
            )}
          >
            <p
              className={cn(
                "text-xs uppercase tracking-wide",
                paper ? "text-zinc-500" : "text-muted-foreground"
              )}
            >
              <span className={cn("font-bold", paper ? "text-white" : "text-foreground")}>{e.coachName}</span>
              <span className={cn("mx-1.5", paper ? "text-zinc-500" : "text-muted-foreground")}>·</span>
              <span>{e.bonusTypeLabel}</span>
            </p>
            <p
              className={cn(
                "mt-2 whitespace-pre-line text-sm italic leading-relaxed",
                paper ? "text-zinc-400" : "text-muted-foreground"
              )}
            >
              {e.narrative}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
