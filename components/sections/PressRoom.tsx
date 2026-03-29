import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Newspaper } from "lucide-react"
import type { Article } from "@/lib/types"

const categoryColors: Record<string, string> = {
  Analyse: "bg-primary/20 text-primary",
  Interview: "bg-accent/20 text-accent",
  "Rumeur mercato": "bg-chart-3/20 text-chart-3",
  Tactique: "bg-chart-4/20 text-chart-4"
}

interface PressRoomProps {
  articles: Article[]
}

export function PressRoom({ articles }: PressRoomProps) {
  // If no articles, show empty state
  if (articles.length === 0) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Salle de presse
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Analyses, interviews et prises de parole
          </p>
        </header>
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12">
          Aucun article pour le moment.
        </div>
      </section>
    )
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <header className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Salle de presse
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Analyses, interviews et prises de parole
          </p>
        </header>
        <Button variant="outline" size="sm" className="hidden w-full gap-2 sm:inline-flex sm:w-auto">
          <Newspaper className="h-4 w-4" />
          Tous les articles
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {articles.slice(0, 4).map((article) => (
          <Card
            key={article.id}
            className="group border-border bg-card shadow-none transition-colors hover:border-primary/40"
          >
            <CardContent className="flex h-full flex-col p-4 sm:p-5">
              <div className="mb-3">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                    categoryColors[article.category] || "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {article.category}
                </span>
              </div>
              <h3 className="mb-2 text-balance font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base">
                {article.title}
              </h3>
              {article.excerpt ? (
                <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {article.excerpt}
                </p>
              ) : null}
              <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-3">
                <span className="text-xs text-muted-foreground">{formatDate(article.published_at)}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
