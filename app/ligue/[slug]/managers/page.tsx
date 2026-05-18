import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import { getCurrentSeason, getLeagueBySlug, getManagersWithStats } from "@/lib/queries"
import { ManagersPageClient } from "@/components/managers/ManagersPageClient"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) {
    return { title: "Entraîneurs" }
  }
  return {
    title: `Les entraîneurs — ${league.name}`,
    description: `Trombinoscope des entraîneurs de ${league.name} : stats, palmarès et lignes narratives.`,
  }
}

export default async function ManagersPage({ params }: PageProps) {
  const { slug } = await params
  const league = await getLeagueBySlug(slug)
  if (!league) {
    notFound()
  }

  const season = await getCurrentSeason(league.id)
  if (!season) {
    notFound()
  }

  const managers = await getManagersWithStats(season.id, league.id, season)
  const total = managers.length

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <nav aria-label="Fil d’Ariane">
          <Link
            href={`/ligue/${encodeURIComponent(league.slug)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Retour au tableau de bord
          </Link>
        </nav>

        <header className="space-y-2 border-b border-border/60 pb-6">
          <p className="section-label">La Gazzattak</p>
          <h1 className="text-balance text-2xl tracking-tight text-foreground sm:text-3xl">
            LES ENTRAÎNEURS
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Saison 10 · {total} entraîneur{total !== 1 ? "s" : ""} · L1 &amp; L2
          </p>
        </header>

        <ManagersPageClient managers={managers} />
      </div>
    </div>
  )
}
