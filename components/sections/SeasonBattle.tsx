"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChevronDown, User } from "lucide-react"
import type { ManagerWithTeam, StandingsHistoryWithManager } from "@/lib/types"
import { useStandingsComparisonSelection } from "@/hooks/useStandingsComparisonSelection"
import { CHART_LINE_COLORS } from "@/lib/chart-line-colors"
import { chartLineKey } from "@/lib/standings-comparison"
import { cn } from "@/lib/utils"

interface SeasonBattleProps {
  /** Used to scope comparison prefs in localStorage per league. */
  leagueId?: string | null
  managers: ManagerWithTeam[]
  standingsHistory: StandingsHistoryWithManager[]
}

export function SeasonBattle({ leagueId, managers, standingsHistory }: SeasonBattleProps) {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const onChange = () => setIsNarrow(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const comparisonRows = useMemo(
    () =>
      standingsHistory.map((s) => ({
        manager_id: s.manager_id,
        matchday_number: s.matchday_number,
        rank: s.rank,
      })),
    [standingsHistory]
  )

  const managerIds = useMemo(() => managers.map((m) => m.id), [managers])

  const {
    viewerManagerId,
    extraManagerIds,
    visibleManagerIds,
    toggleExtra,
    setAsViewer,
    maxExtra,
    canAddExtra,
  } = useStandingsComparisonSelection(managerIds, comparisonRows, leagueId)

  const managersById = useMemo(
    () => new Map(managers.map((m) => [m.id, m])),
    [managers]
  )

  const visibleManagers = useMemo(
    () =>
      visibleManagerIds
        .map((id) => managersById.get(id))
        .filter((m): m is ManagerWithTeam => m != null),
    [visibleManagerIds, managersById]
  )

  const labelFor = (m: ManagerWithTeam) => m.team?.name || m.name

  const matchdays = [...new Set(standingsHistory.map((s) => s.matchday_number))].sort(
    (a, b) => a - b
  )

  const chartData = useMemo(() => {
    return matchdays.map((matchday) => {
      const dataPoint: Record<string, number | string> = {
        name: `J${matchday}`,
      }

      const matchdayStandings = standingsHistory.filter((s) => s.matchday_number === matchday)

      visibleManagers.forEach((manager) => {
        const standing = matchdayStandings.find((s) => s.manager_id === manager.id)
        if (standing) {
          dataPoint[chartLineKey(manager.id)] = standing.rank
        }
      })

      return dataPoint
    })
  }, [matchdays, standingsHistory, visibleManagers])

  const rankDomain = Math.max(managers.length, 2)
  const yTicks = Array.from({ length: rankDomain }, (_, i) => i + 1)

  const seriesMeta = visibleManagers.map((manager, index) => ({
    id: manager.id,
    lineKey: chartLineKey(manager.id),
    label: labelFor(manager),
    color: CHART_LINE_COLORS[index % CHART_LINE_COLORS.length],
  }))

  if (chartData.length === 0 || managers.length === 0) {
    return (
      <section>
        <Card className="border-border bg-card gap-2 py-0 shadow-none">
          <CardHeader className="space-y-1 px-4 pb-0 pt-2 sm:px-6 sm:pt-6">
            <CardDescription className="text-sm text-muted-foreground">
              Évolution des places — jusqu&apos;à 4 managers comparés. Rank 1 en haut.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 sm:px-6">
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border sm:h-80">
              <p className="px-4 text-center text-sm text-muted-foreground">
                Aucune donnée de classement pour le moment.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  const viewer = viewerManagerId ? managersById.get(viewerManagerId) : null

  return (
    <section>
      <Card className="border-border bg-card gap-2 py-0 shadow-none">
        <CardHeader className="space-y-1 px-4 pb-0 pt-2 sm:px-6 sm:pt-6">
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            Jusqu&apos;à <strong className="font-medium text-foreground">4 courbes</strong> : vous +{" "}
            {maxExtra} autres. La 1<sup>re</sup> place reste en haut du graphique.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-4 sm:px-6 sm:pb-6">
          <div className="mb-4 space-y-2.5 px-4 sm:px-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                Comparer
              </p>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold tabular-nums">
                {extraManagerIds.length}/{maxExtra}
              </Badge>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3">
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
              {viewer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-xs sm:text-sm"
                    >
                      <User className="h-3.5 w-3.5 opacity-90" aria-hidden />
                      <span className="max-w-[9rem] truncate sm:max-w-[12rem]">
                        Vous · {labelFor(viewer)}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                    {managers.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onSelect={() => setAsViewer(m.id)}
                        className={cn(m.id === viewerManagerId && "bg-accent/50")}
                      >
                        {labelFor(m)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {managers
                .slice()
                .sort((a, b) => labelFor(a).localeCompare(labelFor(b), "fr"))
                .map((m) => {
                  if (m.id === viewerManagerId) return null
                  const isOn = visibleManagerIds.includes(m.id)
                  const disabled = !isOn && !canAddExtra
                  return (
                    <Button
                      key={m.id}
                      type="button"
                      variant={isOn ? "secondary" : "outline"}
                      size="sm"
                      disabled={disabled}
                      onClick={() => toggleExtra(m.id)}
                      className={cn(
                        "h-9 shrink-0 rounded-full px-3 text-xs sm:text-sm",
                        disabled && "opacity-50"
                      )}
                    >
                      <span className="max-w-[8.5rem] truncate sm:max-w-[11rem]">{labelFor(m)}</span>
                    </Button>
                  )
                })}
            </div>
            </div>
            {managers.length > 1 ? (
              <p className="hidden text-xs text-muted-foreground sm:block">
                Astuce : menu « Vous » pour votre profil. Les pilules ajoutent ou retirent une courbe.
              </p>
            ) : null}
          </div>

          <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div
              className="min-w-[300px] px-4 sm:min-w-0 sm:px-0"
              style={{ minWidth: isNarrow ? Math.max(300, matchdays.length * 36 + 120) : undefined }}
            >
              <div className="h-[272px] sm:h-80 lg:h-[22rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={
                      isNarrow
                        ? { top: 8, right: 6, left: -18, bottom: 4 }
                        : { top: 12, right: 12, left: 4, bottom: 8 }
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.45}
                      vertical={!isNarrow}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: isNarrow ? 10 : 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval={isNarrow ? "preserveStartEnd" : 0}
                    />
                    <YAxis
                      reversed
                      domain={[1, rankDomain]}
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: isNarrow ? 10 : 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={isNarrow ? 28 : 36}
                      ticks={yTicks}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--popover-foreground)",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "var(--popover-foreground)" }}
                      formatter={(value: number | string, name: string) => {
                        const meta = seriesMeta.find((s) => s.lineKey === name)
                        return [typeof value === "number" ? `${value}ᵉ` : value, meta?.label ?? name]
                      }}
                    />
                    {!isNarrow ? (
                      <Legend
                        wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                        iconType="line"
                        formatter={(value) => {
                          const meta = seriesMeta.find((s) => s.lineKey === value)
                          return meta?.label ?? value
                        }}
                      />
                    ) : null}
                    {seriesMeta.map((s) => (
                      <Line
                        key={s.id}
                        type="monotone"
                        dataKey={s.lineKey}
                        name={s.lineKey}
                        stroke={s.color}
                        strokeWidth={isNarrow ? 1.75 : 2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {isNarrow ? (
            <div className="mt-3 border-t border-border/60 px-4 pt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Légende
              </p>
              <div className="flex max-h-28 flex-wrap gap-x-3 gap-y-2 overflow-y-auto text-xs">
                {seriesMeta.map((m) => (
                  <span key={m.id} className="inline-flex max-w-[11rem] items-center gap-1.5">
                    <span
                      className="h-0.5 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                      aria-hidden
                    />
                    <span className="truncate text-muted-foreground">{m.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
