import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticlePage } from "@/components/articles/ArticlePage"
import { getArticle } from "@/lib/articles"
import { getCurrentSeason, getLeagueBySlug, listLeagues } from "@/lib/queries"

type PageProps = {
  params: Promise<{ slug: string; articleSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, articleSlug } = await params
  const article = getArticle(slug, articleSlug)

  if (!article) {
    return {
      title: "Article introuvable | La Gazzatak",
    }
  }

  return {
    title: "Dans la tête du champion | La Gazzatak",
    description: article.excerpt,
  }
}

export default async function LeagueArticleRoute({ params }: PageProps) {
  const { slug, articleSlug } = await params
  const [league, allLeagues] = await Promise.all([getLeagueBySlug(slug), listLeagues()])
  const article = getArticle(slug, articleSlug)

  if (!league || !article) {
    notFound()
  }

  const season = await getCurrentSeason(league.id)

  return <ArticlePage article={article} league={league} season={season} allLeagues={allLeagues} />
}
