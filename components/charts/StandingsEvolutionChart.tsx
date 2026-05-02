"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User } from "lucide-react";
import { useStandingsComparisonSelection } from "@/hooks/useStandingsComparisonSelection";
import { CHART_LINE_COLORS } from "@/lib/chart-line-colors";
import { chartLineKey } from "@/lib/standings-comparison";
import { cn } from "@/lib/utils";

type Manager = {
  id: string;
  name: string;
};

type StandingHistoryRow = {
  id: string;
  season_id: string;
  manager_id: string;
  matchday_number: number;
  rank: number;
  points: number;
  goals_for: number;
  goals_against: number;
  form: string | null;
  created_at: string;
};

type Props = {
  standings: StandingHistoryRow[];
  managers: Manager[];
  /** Scope localStorage comparison prefs per league when set. */
  leagueId?: string | null;
  /** Titre pédagogique masqué (une page apporte le titre) */
  hideHeader?: boolean;
};

export default function StandingsEvolutionChart({
  standings,
  managers,
  leagueId,
  hideHeader = false,
}: Props) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const comparisonRows = useMemo(
    () =>
      standings.map((s) => ({
        manager_id: s.manager_id,
        matchday_number: s.matchday_number,
        rank: s.rank,
      })),
    [standings]
  );

  const managerIds = useMemo(() => managers.map((m) => m.id), [managers]);

  const {
    viewerManagerId,
    visibleManagerIds,
    toggleExtra,
    setAsViewer,
    maxExtra,
    canAddExtra,
  } = useStandingsComparisonSelection(managerIds, comparisonRows, leagueId);

  const managersById = useMemo(
    () => new Map(managers.map((m) => [m.id, m])),
    [managers]
  );

  const visibleManagers = useMemo(
    () =>
      visibleManagerIds
        .map((id) => managersById.get(id))
        .filter((m): m is Manager => m != null),
    [visibleManagerIds, managersById]
  );

  const groupedByMatchday = useMemo(() => {
    return standings.reduce<Record<number, Record<string, number>>>((acc, row) => {
      if (!visibleManagerIds.includes(row.manager_id)) return acc;
      const key = chartLineKey(row.manager_id);
      if (!acc[row.matchday_number]) acc[row.matchday_number] = {};
      acc[row.matchday_number][key] = row.rank;
      return acc;
    }, {});
  }, [standings, visibleManagerIds]);

  const chartData = useMemo(
    () =>
      Object.entries(groupedByMatchday)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([matchday, values]) => ({
          matchday: `J${matchday}`,
          ...values,
        })),
    [groupedByMatchday]
  );

  const rankDomain = Math.max(managers.length, 2);
  const yTicks = Array.from({ length: rankDomain }, (_, i) => i + 1);

  const seriesMeta = visibleManagers.map((m, index) => ({
    id: m.id,
    lineKey: chartLineKey(m.id),
    label: m.name,
    color: CHART_LINE_COLORS[index % CHART_LINE_COLORS.length],
  }));

  const minChartWidth = isNarrow
    ? Math.max(300, chartData.length * 36 + 120)
    : undefined;

  const viewer = viewerManagerId ? managersById.get(viewerManagerId) : null;

  if (managers.length === 0 || standings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-none">
        {!hideHeader && (
          <div className="space-y-1 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              La bataille pour le titre
            </h2>
            <p className="text-sm text-muted-foreground">
              Comparaison jusqu&apos;à 4 managers — rank 1 en haut.
            </p>
          </div>
        )}
        <div className="px-4 py-12 text-center text-sm text-muted-foreground sm:px-6">
          Aucune donnée de classement pour le moment.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-none">
      {!hideHeader && (
        <div className="space-y-1 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            La bataille pour le titre
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vous + jusqu&apos;à {maxExtra} autres coaches (4 courbes max). La 1<sup>re</sup> place en haut. Défilement
            horizontal sur petit écran.
          </p>
        </div>
      )}

      <div className="space-y-2 border-b border-border/60 px-4 py-3 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          Comparer
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible">
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
                  <span className="max-w-[9rem] truncate sm:max-w-[12rem]">Vous · {viewer.name}</span>
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
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {managers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "fr"))
            .map((m) => {
              if (m.id === viewerManagerId) return null;
              const isOn = visibleManagerIds.includes(m.id);
              const disabled = !isOn && !canAddExtra;
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
                  <span className="max-w-[8.5rem] truncate sm:max-w-[11rem]">{m.name}</span>
                </Button>
              );
            })}
        </div>
      </div>

      <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] px-0 pb-4 sm:px-6 sm:pb-6">
        <div
          className="min-w-[300px] px-4 sm:min-w-0 sm:px-0"
          style={{ minWidth: minChartWidth }}
        >
          <div className="h-[280px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={
                  isNarrow
                    ? { top: 8, right: 8, left: -14, bottom: 4 }
                    : { top: 16, right: 20, left: 0, bottom: 8 }
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  opacity={0.45}
                  vertical={!isNarrow}
                />
                <XAxis
                  dataKey="matchday"
                  tick={{ fontSize: isNarrow ? 10 : 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval={isNarrow ? "preserveStartEnd" : 0}
                />
                <YAxis
                  domain={[1, rankDomain]}
                  reversed
                  allowDecimals={false}
                  tick={{ fontSize: isNarrow ? 10 : 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={isNarrow ? 28 : 40}
                  ticks={yTicks}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                  formatter={(value: number | string, name: string) => {
                    const meta = seriesMeta.find((s) => s.lineKey === name);
                    return [typeof value === "number" ? `${value}ᵉ` : value, meta?.label ?? name];
                  }}
                />
                {!isNarrow ? (
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) => {
                      const meta = seriesMeta.find((s) => s.lineKey === value);
                      return meta?.label ?? value;
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
                    strokeWidth={isNarrow ? 1.75 : 2.25}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isNarrow && seriesMeta.length > 0 ? (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
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
    </div>
  );
}
