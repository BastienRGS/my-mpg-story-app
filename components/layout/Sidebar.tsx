"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Trophy,
  Users,
  Award,
  History,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Même liste pour la sidebar desktop et le drawer mobile (DashboardClient réutilise <Sidebar />).
 */
const iconMap = {
  LayoutDashboard,
  Users,
  Award,
  History,
} as const

type NavIconKey = keyof typeof iconMap

type NavItemConfig =
  | {
      id: string
      label: string
      icon: NavIconKey
      kind: "link"
      route: "dashboard" | "historique" | "managers"
    }
  | {
      id: string
      label: string
      icon: NavIconKey
      kind: "soon"
    }

const navItems: NavItemConfig[] = [
  { id: "dashboard", label: "Tableau de bord", icon: "LayoutDashboard", kind: "link", route: "dashboard" },
  { id: "managers", label: "Les entraîneurs", icon: "Users", kind: "link", route: "managers" },
  { id: "trophees", label: "Trophées", icon: "Award", kind: "soon" },
  { id: "historique", label: "Historique", icon: "History", kind: "link", route: "historique" },
]

interface SidebarProps {
  className?: string
  /** Slug de la ligue courante (routes sous /ligue/[slug]/…). */
  leagueSlug: string
}

export function Sidebar({ className, leagueSlug }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const dashboardHref = `/ligue/${encodeURIComponent(leagueSlug)}`
  const dashboardPathRaw = `/ligue/${leagueSlug}`
  const isDashboardActive =
    pathname === dashboardHref || pathname === dashboardPathRaw

  const historiqueHref = `/ligue/${encodeURIComponent(leagueSlug)}/historique`
  const historiquePathRaw = `/ligue/${leagueSlug}/historique`
  const isHistoriqueActive = pathname === historiqueHref || pathname === historiquePathRaw

  const managersHref = "/managers"
  const isManagersActive = pathname === "/managers" || pathname.startsWith("/managers/")

  const isSaisieActive =
    pathname === "/admin/match-results" || pathname.startsWith("/admin/match-results/")

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-auto min-h-16 items-center justify-between border-b border-sidebar-border px-4 py-3">
        {!collapsed && (
          <Link href="/" className="flex min-w-0 flex-col gap-1.5">
            <div className="logotype flex flex-wrap items-baseline gap-0 leading-none">
              <span className="font-display text-xl text-white">La Gazz</span>
              <span className="font-display text-xl text-primary">attak</span>
            </div>
            <div className="logotype-tagline hidden md:block">
            Vos résultats, vos humiliations, votre gloire !
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary" title="La Gazzattak">
            <Trophy className="h-5 w-5 text-primary-foreground" aria-hidden />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]

          if (item.kind === "soon") {
            return (
              <div
                key={item.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "cursor-not-allowed opacity-40"
                )}
                aria-disabled
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {!collapsed && (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate">{item.label}</span>
                    <span className="shrink-0 text-xs text-sidebar-foreground/50">Bientôt</span>
                  </span>
                )}
              </div>
            )
          }

          const href =
            item.route === "dashboard"
              ? dashboardHref
              : item.route === "historique"
                ? historiqueHref
                : managersHref
          const isActive =
            item.route === "dashboard"
              ? isDashboardActive
              : item.route === "historique"
                ? isHistoriqueActive
                : isManagersActive

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
        {!collapsed ? (
          <Link
            href="/admin/match-results"
            className={cn(
              "mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-sidebar-border px-3 py-2.5 text-sm font-medium transition-colors",
              isSaisieActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
            <span>Saisie résultats</span>
          </Link>
        ) : (
          <Link
            href="/admin/match-results"
            title="Saisie résultats"
            className={cn(
              "mt-2 flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/80 transition-colors",
              isSaisieActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Reduire</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
