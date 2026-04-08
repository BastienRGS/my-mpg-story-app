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

type Props = {
  paragraphs: [StoryTextSegment[], StoryTextSegment[], StoryTextSegment[]]
}

export function DashboardStorySynthesis({ paragraphs }: Props) {
  return (
    <section className="space-y-4" aria-labelledby="synthesis-heading">
      <h2 id="synthesis-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        La synthèse
      </h2>
      <div className="space-y-4 rounded-2xl border border-border/80 bg-card/50 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6">
        <Paragraph segments={paragraphs[0]} />
        <Paragraph segments={paragraphs[1]} />
        <Paragraph segments={paragraphs[2]} />
      </div>
    </section>
  )
}
