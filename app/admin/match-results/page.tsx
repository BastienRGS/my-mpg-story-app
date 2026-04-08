import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { getCurrentSeason, getManagers, listLeagues } from "@/lib/queries"
import { MatchEntryForm, type LeagueOption } from "./MatchEntryForm"

export const metadata = {
  title: "Saisie résultats — Admin",
  description: "Workflow hebdomadaire : enregistrer les matchs après chaque journée.",
}

export default async function AdminMatchResultsPage() {
  const leagues = await listLeagues()

  const leagueOptions: LeagueOption[] = await Promise.all(
    leagues.map(async (l) => {
      const season = await getCurrentSeason(l.id)
      if (!season) {
        return { slug: l.slug, name: l.name, teams: [] as { id: string; label: string }[] }
      }
      const managers = await getManagers(l.id, season.id)
      const teams = managers
        .filter((m) => m.team?.id)
        .map((m) => ({ id: m.team!.id, label: m.team!.name || m.name }))
      return { slug: l.slug, name: l.name, teams }
    })
  )

  const formEnabled = Boolean(
    process.env.ADMIN_MATCH_ENTRY_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const preferred = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG?.trim()
  const defaultLeagueSlug =
    leagueOptions.find((l) => l.slug === preferred && l.teams.length >= 2)?.slug ??
    leagueOptions.find((l) => l.teams.length >= 2)?.slug ??
    leagueOptions[0]?.slug ??
    ""

  if (leagueOptions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Saisie des résultats</h1>
        <p className="mt-2 text-sm text-muted-foreground">Aucune ligue trouvée dans Supabase.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin · workflow hebdomadaire
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <ClipboardList className="h-7 w-7 shrink-0 text-primary" aria-hidden />
            Saisie des résultats
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Après chaque journée : saisir tous les matchs d’un coup (grille) — une ligne par rencontre dans{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">matches</code> (via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">matchday_id</code> →{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">matchdays</code>). Le classement et
            les KPIs sont recalculés automatiquement.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-border bg-card/50 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">Checklist rapide</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Noter les scores de la journée.</li>
            <li>
              Les insérer dans <strong className="text-foreground">matches</strong> (formulaire ci-dessous
              ou éditeur Supabase — détail dans{" "}
              <code className="rounded bg-muted px-1">docs/WEEKLY_WORKFLOW.md</code>).
            </li>
            <li>
              Ouvrir le{" "}
              <Link href="/" className="text-primary underline-offset-4 hover:underline">
                tableau de bord ligue
              </Link>{" "}
              et vérifier qu’il n’y a pas d’alerte rouge.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Documentation complète : fichier{" "}
            <code className="rounded bg-muted px-1">docs/WEEKLY_WORKFLOW.md</code> à la racine du dépôt.
          </p>
        </section>

        {formEnabled && leagueOptions.some((l) => l.teams.length >= 2) ? (
          <MatchEntryForm leagueOptions={leagueOptions} defaultLeagueSlug={defaultLeagueSlug} />
        ) : formEnabled ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
            Au moins <strong className="text-foreground">deux équipes</strong> (`teams`) sont nécessaires
            pour la saison courante d’une ligue. Complétez le roster dans Supabase, puis rechargez cette page.
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Formulaire désactivé</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pour activer la saisie dans l’app, ajoutez dans{" "}
              <code className="rounded bg-muted px-1">.env.local</code> :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs text-muted-foreground">
              <li>SUPABASE_SERVICE_ROLE_KEY=… (clé service role, secrète)</li>
              <li>ADMIN_MATCH_ENTRY_SECRET=… (mot de passe que vous retapez dans le formulaire)</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Sinon, utilisez uniquement l’éditeur de table Supabase — procédure décrite dans{" "}
              <code className="rounded bg-muted px-1">docs/WEEKLY_WORKFLOW.md</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
