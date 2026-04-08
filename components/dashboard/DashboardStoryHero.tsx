import type { StoryTextSegment } from "@/lib/dashboard-story-copy"
import { cn } from "@/lib/utils"

type Props = {
  /** Numéro affiché dans le petit badge au-dessus du titre (ex. J5). */
  matchdayNumber: number
  leagueName: string
  seasonName: string
  headlineSegments: StoryTextSegment[]
  dek: string
  meta: {
    matchdayNumber: number
    matchesThisRound: number
    managerCount: number
  }
}

export function DashboardStoryHero({
  matchdayNumber,
  leagueName,
  seasonName,
  headlineSegments,
  dek,
  meta,
}: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-zinc-950 px-4 pb-10 pt-8 text-zinc-50 shadow-xl shadow-black/20 sm:px-8 sm:pb-12 sm:pt-10"
      aria-label="À la une"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative space-y-5 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide text-zinc-200 sm:text-xs">
            <span className="sm:hidden">J{matchdayNumber}</span>
            <span className="hidden sm:inline">Journée {matchdayNumber}</span>
          </span>

          <h1 className="text-balance text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {headlineSegments.map((seg, i) => (
              <span key={i} className={cn(seg.emphasize && "text-primary")}>
                {seg.text}
              </span>
            ))}
          </h1>

          <p className="text-sm font-medium text-zinc-400 sm:text-base">
            {leagueName}
            <span className="text-zinc-600"> · </span>
            {seasonName}
          </p>
        </div>

        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">{dek}</p>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-5 text-xs text-zinc-400 sm:text-sm">
          <div>
            <dt className="sr-only">Matchs cette journée</dt>
            <dd>
              <span className="font-semibold text-zinc-200">{meta.matchesThisRound}</span> match
              {meta.matchesThisRound > 1 ? "s" : ""} comptabilisé{meta.matchesThisRound > 1 ? "s" : ""}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Managers</dt>
            <dd>
              <span className="font-semibold text-zinc-200">{meta.managerCount}</span> coach
              {meta.managerCount > 1 ? "es" : ""}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
