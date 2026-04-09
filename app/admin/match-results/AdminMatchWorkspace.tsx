"use client"

import { useEffect, useState, type ReactNode } from "react"
import { MatchEntryForm, type LeagueOption } from "./MatchEntryForm"
import { cn } from "@/lib/utils"

type AdminMatchWorkspaceProps = {
  leagueOptions: LeagueOption[]
  /** Première ligue de la liste (ordre Supabase) */
  defaultLeagueSlug: string
  children: ReactNode
}

export function AdminMatchWorkspace({
  leagueOptions,
  defaultLeagueSlug,
  children,
}: AdminMatchWorkspaceProps) {
  const [leagueSlug, setLeagueSlug] = useState(
    () => defaultLeagueSlug || leagueOptions[0]?.slug || ""
  )

  useEffect(() => {
    if (leagueOptions.length === 0) return
    const ok = leagueOptions.some((l) => l.slug === leagueSlug)
    if (!ok) {
      setLeagueSlug(leagueOptions[0]?.slug ?? "")
    }
  }, [leagueOptions, leagueSlug])

  return (
    <>
      <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Ligue active</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Journées, matchs et résultats sont enregistrés pour la saison courante (
          <code className="rounded bg-muted px-1">is_current</code>) de la ligue choisie.
        </p>
        <div className="mt-3">
          {leagueOptions.length > 1 ? (
            <div
              className="flex flex-wrap items-center gap-1 rounded-lg bg-secondary/40 p-1"
              role="tablist"
              aria-label="Choisir la ligue"
            >
              {leagueOptions.map((l) => (
                <button
                  key={l.slug}
                  type="button"
                  role="tab"
                  aria-selected={l.slug === leagueSlug}
                  onClick={() => setLeagueSlug(l.slug)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    l.slug === leagueSlug
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.name}
                  {l.teams.length < 2 ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (équipes insuffisantes)
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">{leagueOptions[0]?.name}</p>
          )}
        </div>
      </section>

      {children}

      <MatchEntryForm leagueOptions={leagueOptions} leagueSlug={leagueSlug} />
    </>
  )
}
