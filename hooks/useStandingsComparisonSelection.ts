"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  readCompareManagerIds,
  writeCompareManagerIds,
  writeViewerManagerId,
  resolveDefaultViewerManagerId,
  resolveViewerManagerIdWithStoredPreference,
  type StandingRowForComparison,
} from "@/lib/standings-comparison"

const MAX_EXTRA = 3
const MAX_VISIBLE = 4

export function useStandingsComparisonSelection(
  managerIds: string[],
  standingsRows: StandingRowForComparison[],
  leagueId?: string | null
) {
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [extraIds, setExtraIds] = useState<string[]>([])

  useEffect(() => {
    if (managerIds.length === 0) {
      setViewerId(null)
      setExtraIds([])
      return
    }

    const resolved = resolveViewerManagerIdWithStoredPreference(managerIds, standingsRows, leagueId)
    setViewerId(resolved)

    const storedExtras = readCompareManagerIds(leagueId)
      .filter((id) => id !== resolved && managerIds.includes(id))
      .slice(0, MAX_EXTRA)
    setExtraIds(storedExtras)
  }, [managerIds, standingsRows, leagueId])

  const visibleManagerIds = useMemo(() => {
    if (managerIds.length === 0) return []
    const effectiveViewer =
      viewerId && managerIds.includes(viewerId)
        ? viewerId
        : resolveDefaultViewerManagerId(managerIds, standingsRows, leagueId) ?? managerIds[0]
    const merged = [
      effectiveViewer,
      ...extraIds.filter((id) => id !== effectiveViewer && managerIds.includes(id)),
    ]
    return Array.from(new Set(merged)).slice(0, MAX_VISIBLE)
  }, [viewerId, extraIds, managerIds, standingsRows, leagueId])

  const toggleExtra = useCallback(
    (id: string) => {
      if (!viewerId || id === viewerId) return
      if (!managerIds.includes(id)) return

      setExtraIds((prev) => {
        const without = prev.filter((x) => x !== id)
        if (prev.includes(id)) {
          writeCompareManagerIds(without, leagueId)
          return without
        }
        if (prev.length >= MAX_EXTRA) return prev
        const next = [...prev, id]
        writeCompareManagerIds(next, leagueId)
        return next
      })
    },
    [viewerId, managerIds, leagueId]
  )

  const setAsViewer = useCallback((id: string) => {
    if (!managerIds.includes(id)) return
    writeViewerManagerId(id, leagueId)
    setViewerId(id)
    setExtraIds((prev) => {
      const next = prev.filter((x) => x !== id).slice(0, MAX_EXTRA)
      writeCompareManagerIds(next, leagueId)
      return next
    })
  }, [managerIds, leagueId])

  const canAddExtra = extraIds.length < MAX_EXTRA

  return {
    viewerManagerId: viewerId,
    extraManagerIds: extraIds,
    visibleManagerIds,
    toggleExtra,
    setAsViewer,
    maxExtra: MAX_EXTRA,
    maxVisible: MAX_VISIBLE,
    canAddExtra,
  }
}
