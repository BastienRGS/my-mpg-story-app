import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft } from "lucide-react"
import { getAllManagersWithStats } from "@/lib/queries"
import { ManagersPageClient } from "@/components/managers/ManagersPageClient"

export const metadata: Metadata = {
  title: "Les entraîneurs — La Gazzattak",
  description:
    "Trombinoscope de tous les entraîneurs (Ligue 1 et Ligue 2) : stats, palmarès et lignes narratives.",
}

export default async function AllManagersPage() {
  const managers = await getAllManagersWithStats()
  const total = managers.length

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <nav aria-label="Fil d’Ariane">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Retour à l’accueil
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

        {total === 0 ? (
          <p className="text-sm text-muted-foreground" role="status">
            Aucun entraîneur n’est disponible pour le moment. Vérifiez la connexion aux données ou
            réessayez plus tard.
          </p>
        ) : (
          <ManagersPageClient managers={managers} />
        )}
      </div>
    </div>
  )
}
