"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Bell, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { League, Season } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onMenuClick?: () => void
  league?: League | null
  season?: Season | null
  /** For lightweight league switching (links to /ligue/[slug]). */
  allLeagues?: League[]
}

export function Header({ onMenuClick, league, season, allLeagues = [] }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("")

  const switcherLeagues = allLeagues.length > 0 ? allLeagues : league ? [league] : []

  return (
    <header
      className={cn(
        "shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "h-14 sm:h-16"
      )}
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        {/* Left */}
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10 lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          ) : null}

          {switcherLeagues.length > 1 ? (
            <div className="flex items-center gap-1 rounded-lg bg-secondary/40 p-1">
              {switcherLeagues.map((l) => (
                <Link
                  key={l.id}
                  href={`/ligue/${encodeURIComponent(l.slug)}`}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    l.id === league?.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.name}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-sm font-semibold">{league?.name}</span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden h-9 shrink-0 gap-2 text-muted-foreground sm:h-10 md:flex"
              >
                <span className="max-w-[10rem] truncate lg:max-w-[14rem]">
                  {season?.name || "Saison"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>{season?.name || "Saison"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 w-48 bg-secondary/50 pl-9 lg:w-64"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative hidden h-9 w-9 sm:inline-flex sm:h-10 sm:w-10"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative hidden h-9 w-9 rounded-full sm:inline-flex sm:h-10 sm:w-10"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                    U
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mon profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
