import { dansLaTeteDuChampion } from "@/content/articles/dans-la-tete-du-champion"

export type EditorialTextSegment = {
  text: string
  strong?: boolean
}

export type EditorialArticleBlock =
  | {
      type: "paragraph"
      content: EditorialTextSegment[]
    }
  | {
      type: "heading"
      text: string
    }
  | {
      type: "quote"
      text: string
      variant?: "lead" | "standard"
    }

export type EditorialArticle = {
  slug: string
  leagueSlug: string
  category: string
  eyebrow: string
  kicker: string
  title: string
  excerpt: string
  publishedAt: string
  author: string
  heroImage?: string
  content: EditorialArticleBlock[]
}

const articles = [dansLaTeteDuChampion] satisfies EditorialArticle[]

export function getArticle(leagueSlug: string, articleSlug: string): EditorialArticle | null {
  return articles.find((article) => article.leagueSlug === leagueSlug && article.slug === articleSlug) ?? null
}

export function getArticlesForLeague(leagueSlug: string): EditorialArticle[] {
  return articles.filter((article) => article.leagueSlug === leagueSlug)
}
