"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  Award,
  Newspaper,
  History,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  Award,
  Newspaper,
  History
}

const navItems = [
  { id: "dashboard", label: "Tableau de bord", icon: "LayoutDashboard" },
  { id: "classement", label: "Classement", icon: "Trophy" },
  { id: "calendrier", label: "Calendrier", icon: "Calendar" },
  { id: "managers", label: "Managers", icon: "Users" },
  { id: "trophees", label: "Trophees", icon: "Award" },
  { id: "actualites", label: "Actualites", icon: "Newspaper" },
  { id: "historique", label: "Historique", icon: "History" }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">Fair Route</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard
          const isActive = activeItem === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
        {!collapsed ? (
          <Link
            href="/admin/match-results"
            className="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-sidebar-border px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
            <span>Saisie résultats</span>
          </Link>
        ) : (
          <Link
            href="/admin/match-results"
            className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            title="Saisie résultats"
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Reduire</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
