"use client"

import { useState, useTransition } from "react"
import { closeSeasonAction, reopenSeasonAction } from "@/app/admin/match-results/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type LeagueSeasonEntry = {
  slug: string
  name: string
  season: { name: string; is_finished: boolean } | null
}

type Props = {
  leagues: LeagueSeasonEntry[]
}

function SeasonCard({ entry }: { entry: LeagueSeasonEntry }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const { slug, name, season } = entry

  if (!season) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">Aucune saison courante</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isFinished = season.is_finished

  function handleClose() {
    const confirmed = window.confirm(
      `Confirmer la clôture de la saison ${season!.name} pour ${name} ? Cette action est irréversible.`
    )
    if (!confirmed) return
    setFeedback(null)
    startTransition(async () => {
      const result = await closeSeasonAction(slug)
      if (result.success) {
        setFeedback({ ok: true, text: "Saison clôturée ✓" })
      } else {
        setFeedback({ ok: false, text: result.error ?? "Erreur inconnue." })
      }
    })
  }

  function handleReopen() {
    const confirmed = window.confirm(
      `Rouvrir la saison ${season!.name} pour ${name} ? Le bilan de saison sera masqué.`
    )
    if (!confirmed) return
    setFeedback(null)
    startTransition(async () => {
      const result = await reopenSeasonAction(slug)
      if (result.success) {
        setFeedback({ ok: true, text: "Saison réouverte ✓" })
      } else {
        setFeedback({ ok: false, text: result.error ?? "Erreur inconnue." })
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">Saison {season.name}</p>
          <div className="flex items-center gap-2">
            {isFinished ? (
              <Badge variant="destructive">Terminée</Badge>
            ) : (
              <Badge className="bg-green-600 text-white hover:bg-green-700">En cours</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isFinished ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleReopen}
            >
              {isPending ? "Traitement…" : "Rouvrir la saison"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleClose}
            >
              {isPending ? "Traitement…" : "Clôturer la saison"}
            </Button>
          )}
          {feedback && (
            <p
              className={
                feedback.ok
                  ? "text-xs text-green-600"
                  : "text-xs text-destructive"
              }
            >
              {feedback.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SeasonManager({ leagues }: Props) {
  return (
    <div className="space-y-3">
      {leagues.map((entry) => (
        <SeasonCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
