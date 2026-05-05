import type { ReactNode } from "react"
import type {
  BonusHighlightBlock,
  ManagerWithTeam,
  MatchdayScoresRow,
  StandingsHistoryWithManager,
} from "@/lib/types"
import { MatchdayNarrativeBonusSection } from "@/components/sections/MatchdayNarrative"
import type { StoryTextSegment } from "@/lib/dashboard-story-copy"
import { cn } from "@/lib/utils"

function Paragraph({ segments }: { segments: StoryTextSegment[] }) {
  return (
    <p className="text-pretty text-sm leading-relaxed text-foreground sm:text-base">
      {segments.map((seg, i) => (
        <span key={i} className={cn(seg.emphasize && "font-bold text-foreground")}>
          {seg.text}
        </span>
      ))}
    </p>
  )
}

function NarrativeSubsection({
  kicker,
  children,
  withTopBorder,
}: {
  kicker: string
  children: ReactNode
  withTopBorder?: boolean
}) {
  return (
    <div className={cn("space-y-2", withTopBorder && "mb-0 border-t border-border/60")}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[rgba(61,220,132,1)]">{kicker}</h3>
      {children}
    </div>
  )
}

type Props = {
  paragraphs: [StoryTextSegment[], StoryTextSegment[], StoryTextSegment[]]
  bonusHighlight: BonusHighlightBlock | null
  matchdayNumber?: number
  matchesForMatchday?: MatchdayScoresRow[]
  managers?: ManagerWithTeam[]
  standingsAfterMatchday?: StandingsHistoryWithManager[]
}

/** Sous-blocs Héros / bonus / Impact / match — réutilisés dans le hero ou la carte « La synthèse » seule. */
export function DashboardSynthesisInner({
  paragraphs,
  bonusHighlight,
  matchdayNumber,
  matchesForMatchday,
  managers,
  standingsAfterMatchday,
}: Props) {
  return (
    <>
      <NarrativeSubsection kicker="HÉROS DU JOUR">
        <Paragraph segments={paragraphs[1]} />
      </NarrativeSubsection>

      <MatchdayNarrativeBonusSection
        bonusHighlight={bonusHighlight}
        variant="dashboard"
        matchdayNumber={matchdayNumber}
        matches={matchesForMatchday}
        managers={managers}
        standingsAfterMatchday={standingsAfterMatchday}
      />

      <NarrativeSubsection kicker="IMPACT CLASSEMENT" withTopBorder>
        <Paragraph segments={paragraphs[0]} />
      </NarrativeSubsection>

      <div className="border-t border-border/60 pt-5">
        <Paragraph segments={paragraphs[2]} />
      </div>
    </>
  )
}

export function DashboardStorySynthesis({
  paragraphs,
  bonusHighlight,
  matchdayNumber,
  matchesForMatchday,
  managers,
  standingsAfterMatchday,
}: Props) {
  return (
    <section className="space-y-4" aria-labelledby="synthesis-heading">
      <h2 id="synthesis-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        La synthèse
      </h2>
      <div className="space-y-5 rounded-2xl border border-border/80 bg-card/50 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
        <DashboardSynthesisInner
          paragraphs={paragraphs}
          bonusHighlight={bonusHighlight}
          matchdayNumber={matchdayNumber}
          matchesForMatchday={matchesForMatchday}
          managers={managers}
          standingsAfterMatchday={standingsAfterMatchday}
        />
      </div>
    </section>
  )
}
