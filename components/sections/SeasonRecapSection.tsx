import type { Manager, Season, SeasonRecap } from "@/lib/types"
import { isRolandoTeam } from "@/lib/matchday-newspaper"
import { Card, CardContent } from "@/components/ui/card"

function teamLabel(m: Manager | null): string {
  if (!m) return "—"
  return m.identity_label?.trim() || m.name
}

function isRolando(m: Manager | null): boolean {
  if (!m) return false
  return isRolandoTeam(m.identity_label?.trim() || m.name)
}

type Props = {
  season: Season
  leagueSlug: string
  recap: SeasonRecap
}

export function SeasonRecapSection({ season, leagueSlug, recap }: Props) {
  const {
    l1Champion,
    l1RunnerUp,
    l1Relegated,
    l2Champion,
    l2Promoted,
    topScorer,
    bestDefense,
    biggestWin,
  } = recap

  const isL1 = leagueSlug.includes("ligue1")
  const champion = isL1 ? l1Champion : l2Champion
  const isDynasty = isRolando(champion)
  const isRolandoRelégué = isL1 && l1Relegated.some(isRolando)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          BILAN DE SAISON
        </p>
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Saison {season.name} — Rideau.
        </h2>
      </div>

      {/* Lore block */}
      {isDynasty && (
        <p className="text-sm italic text-primary">
          Encore les frangins. La dynastie Rolando écrase tout, encore.
        </p>
      )}
      {isRolandoRelégué && !isDynasty && (
        <p className="text-sm italic" style={{ color: "var(--color-crisis, #ef4444)" }}>
          Le trône vacille. Un Rolando file en Ligue 2.
        </p>
      )}

      {/* Palmarès */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {isL1 && (
              <>
                {l1Champion && (
                  <div className="min-w-[130px] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      🏆 Champion L1
                    </p>
                    <p
                      className="font-bold"
                      style={{ color: "var(--color-gold, #f5a623)" }}
                    >
                      {teamLabel(l1Champion)}
                    </p>
                  </div>
                )}
                {l1RunnerUp && (
                  <div className="min-w-[130px] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      🥈 Vice-champion
                    </p>
                    <p className="font-semibold text-muted-foreground">
                      {teamLabel(l1RunnerUp)}
                    </p>
                  </div>
                )}
                {l1Relegated.length > 0 && (
                  <div className="min-w-[130px] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      ⬇️ Relégués
                    </p>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--color-crisis, #ef4444)" }}
                    >
                      {l1Relegated.map(teamLabel).join(" & ")}
                    </p>
                  </div>
                )}
              </>
            )}
            {!isL1 && (
              <>
                {l2Champion && (
                  <div className="min-w-[130px] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      🏆 Champion L2
                    </p>
                    <p
                      className="font-bold"
                      style={{ color: "var(--color-gold, #f5a623)" }}
                    >
                      {teamLabel(l2Champion)}
                    </p>
                  </div>
                )}
                {l2Promoted.length > 0 && (
                  <div className="min-w-[130px] space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      ⬆️ Promus
                    </p>
                    <p className="font-semibold text-primary">
                      {l2Promoted.map(teamLabel).join(" & ")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {topScorer && (
          <Card className="flex-1">
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                ⚽ Meilleure attaque
              </p>
              <p className="mt-1 font-semibold text-foreground">{teamLabel(topScorer.manager)}</p>
              <p className="text-sm text-muted-foreground">{topScorer.goals} buts marqués</p>
            </CardContent>
          </Card>
        )}
        {bestDefense && (
          <Card className="flex-1">
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                🛡 Meilleure défense
              </p>
              <p className="mt-1 font-semibold text-foreground">{teamLabel(bestDefense.manager)}</p>
              <p className="text-sm text-muted-foreground">{bestDefense.goalsAgainst} buts encaissés</p>
            </CardContent>
          </Card>
        )}
        {biggestWin && (
          <Card className="flex-1">
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                💥 Plus grosse victoire
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {biggestWin.home} {biggestWin.homeScore}–{biggestWin.awayScore} {biggestWin.away}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
