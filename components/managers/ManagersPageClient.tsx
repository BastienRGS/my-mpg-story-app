"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManagerCard } from "@/components/managers/ManagerCard"
import type { ManagerCard as ManagerCardModel } from "@/lib/types"

type Filter = "all" | "L1" | "L2"

export function ManagersPageClient({ managers }: { managers: ManagerCardModel[] }) {
  const [filter, setFilter] = useState<Filter>("all")

  const filtered =
    filter === "all" ? managers : managers.filter((m) => m.currentLeague === filter)

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="all" className="flex-1 sm:flex-initial">
            Tous
          </TabsTrigger>
          <TabsTrigger value="L1" className="flex-1 sm:flex-initial">
            Ligue 1
          </TabsTrigger>
          <TabsTrigger value="L2" className="flex-1 sm:flex-initial">
            Ligue 2
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <ul
        className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:grid-cols-4"
        aria-label="Grille des managers"
      >
        {filtered.map((m) => (
          <li key={m.id} className="flex min-h-0">
            <ManagerCard data={m} />
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun entraîneur dans ce filtre.</p>
      ) : null}
    </div>
  )
}
