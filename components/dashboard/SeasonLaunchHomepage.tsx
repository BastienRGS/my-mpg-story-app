"use client"

import { ChevronsUp, Swords } from "lucide-react"
import type { ReactNode } from "react"
import type { DashboardData, ManagerWithTeam, MatchResult } from "@/lib/types"
import { getSeasonLaunchEditorial } from "@/lib/season-launch-editorial"
import { cn } from "@/lib/utils"

type Props = {
  data: DashboardData
}

function teamLabel(managers: ManagerWithTeam[], teamId: string): string {
  const manager = managers.find((m) => m.team?.id === teamId)
  return manager?.team?.name || manager?.name || "Équipe à confirmer"
}

function scheduledJ1Fixtures(matches: MatchResult[]) {
  return matches.filter((m) => m.matchday_number === 1 && m.home_score == null && m.away_score == null)
}

function currentParticipants(managers: ManagerWithTeam[]) {
  return managers.filter((m) => m.team?.id && m.team.name.trim() !== "")
}

function formatTeamList(teams: string[]) {
  return teams.join(" & ")
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-balance font-display text-[1.75rem] font-black uppercase leading-none tracking-normal text-primary sm:text-[2rem]"
    >
      {children}
    </h2>
  )
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400", className)}>
      {children}
    </p>
  )
}

export function SeasonLaunchHomepage({ data }: Props) {
  const { league, season, managers, matchResults } = data
  if (!league || !season) return null

  const editorial = getSeasonLaunchEditorial(league.slug)
  const fixtures = scheduledJ1Fixtures(matchResults)
  const participants = currentParticipants(managers)
  const [leadStory, ...secondaryStories] = editorial.stories

  return (
    <div className="space-y-9 pb-8 sm:space-y-12">
      <section
        className="relative overflow-hidden border-y border-primary/30 bg-zinc-950 px-4 py-7 text-zinc-50 shadow-xl shadow-black/20 sm:px-8 sm:py-10"
        aria-label="Une de lancement de saison"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[linear-gradient(135deg,transparent,rgba(61,220,132,0.1))]" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.7fr)] lg:items-end">
          <div className="max-w-4xl">
            <p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.24em] text-primary sm:text-xs">
              {editorial.eyebrow}
            </p>
            <h1 className="mt-4 max-w-5xl text-balance font-display text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
              {editorial.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base font-medium leading-relaxed text-zinc-300 sm:text-lg">
              {editorial.dek}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
              <span>{league.name}</span>
              <span className="text-primary" aria-hidden>•</span>
              <span>{season.name}</span>
            </div>
          </div>

          <div className="border-l border-primary/40 pl-4 sm:pl-6 lg:mb-2">
            <Eyebrow>{editorial.heroAside.eyebrow}</Eyebrow>
            <p className="mt-3 text-balance font-display text-3xl font-black uppercase leading-none text-white sm:text-4xl lg:text-5xl">
              {editorial.heroAside.title}
            </p>
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-zinc-400 sm:text-base">
              {editorial.heroAside.text}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="stories-heading">
        <SectionHeading id="stories-heading">À LA UNE</SectionHeading>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.75fr)]">
          {leadStory ? (
            <article className="border-l-4 border-primary py-1 pl-4 sm:pl-6">
              <Eyebrow>{leadStory.category}</Eyebrow>
              <h3 className="mt-3 max-w-3xl text-balance font-display text-4xl font-black leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
                {leadStory.title}
              </h3>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {leadStory.text}
              </p>
            </article>
          ) : null}

          {secondaryStories.length > 0 ? (
            <div className="divide-y divide-border/70">
              {secondaryStories.map((story) => (
                <article key={story.title} className="py-3 first:pt-0 lg:first:pt-2">
                  <Eyebrow>{story.category}</Eyebrow>
                  <h3 className="mt-2 text-balance text-2xl font-black leading-tight text-foreground sm:text-[1.625rem]">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{story.text}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="movements-heading">
        <SectionHeading id="movements-heading">L'ASCENSEUR</SectionHeading>
        <div className="space-y-4">
          {editorial.movements.map((movement) => (
            <article key={movement.label} className="border-l border-primary/50 pl-4 sm:pl-5">
              <div className="flex items-center gap-2">
                <ChevronsUp className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <Eyebrow className="text-zinc-400">{movement.label}</Eyebrow>
              </div>
              <p className="mt-3 text-balance font-display text-3xl font-black leading-none text-foreground sm:text-4xl">
                {formatTeamList(movement.teams)}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {movement.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {participants.length > 0 ? (
        <section className="space-y-4" aria-labelledby="participants-heading">
          <SectionHeading id="participants-heading">FORCES EN PRÉSENCE</SectionHeading>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {participants.map((manager) => (
              <article key={manager.id} className="border border-border bg-card px-3 py-3">
                <h3 className="truncate text-sm font-black text-foreground">
                  {manager.team?.name}
                </h3>
                <p className="truncate text-xs text-muted-foreground">{manager.name}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="j1-heading">
        {fixtures.length > 0 ? (
          <>
            <Eyebrow>PROCHAINE ÉTAPE</Eyebrow>
            <h2 id="j1-heading" className="text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">
              JOURNÉE 1
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {fixtures.map((match) => (
                <article
                  key={match.id}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border border-border bg-card px-3 py-4",
                    "text-sm font-black text-foreground"
                  )}
                >
                  <span className="min-w-0 break-words text-left">{teamLabel(managers, match.home_team_id)}</span>
                  <Swords className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 break-words text-right">{teamLabel(managers, match.away_team_id)}</span>
                </article>
              ))}
            </div>
          </>
        ) : (
          <article>
            <Eyebrow>PROCHAINE ÉTAPE</Eyebrow>
            <h2 id="j1-heading" className="mt-2 text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">
              La J1 se fait attendre.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Les affiches arrivent bientôt. La rédaction garde le micro chaud.
            </p>
          </article>
        )}
      </section>
    </div>
  )
}
