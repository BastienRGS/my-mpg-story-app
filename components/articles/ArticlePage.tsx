"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, X } from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import type { EditorialArticle, EditorialArticleBlock, EditorialTextSegment } from "@/lib/articles"
import type { League, Season } from "@/lib/types"
import { cn } from "@/lib/utils"

type ArticlePageProps = {
  article: EditorialArticle
  league: League
  season: Season | null
  allLeagues: League[]
}

function formatPublishedDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(date))
}

function TextSegments({ segments }: { segments: EditorialTextSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.strong ? (
          <strong key={`${segment.text}-${index}`} className="font-extrabold text-zinc-100">
            {segment.text}
          </strong>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </>
  )
}

function ArticleBlock({ block }: { block: EditorialArticleBlock }) {
  if (block.type === "heading") {
    return (
      <h2 className="pt-7 font-display text-[1.45rem] font-black uppercase leading-tight text-primary sm:text-3xl">
        {block.text}
      </h2>
    )
  }

  if (block.type === "quote") {
    return (
      <blockquote
        className={cn(
          "border-l-4 border-primary pl-4 font-display font-black leading-tight text-zinc-50 sm:pl-6",
          block.variant === "lead"
            ? "my-9 text-[clamp(2rem,8vw,4.4rem)]"
            : "my-7 text-[clamp(1.55rem,5.5vw,2.7rem)]"
        )}
      >
        « {block.text} »
      </blockquote>
    )
  }

  return (
    <p className="text-[1.05rem] leading-[1.85] text-zinc-300 sm:text-[1.15rem]">
      <TextSegments segments={block.content} />
    </p>
  )
}

export function ArticlePage({ article, league, season, allLeagues }: ArticlePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:block">
        <Sidebar leagueSlug={league.slug} />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Fermer le menu</span>
              </Button>
            </div>
            <Sidebar className="border-0" leagueSlug={league.slug} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          league={league}
          season={season}
          allLeagues={allLeagues}
        />

        <main className="flex-1 overflow-y-auto">
          <article className="mx-auto max-w-5xl px-4 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
            <Link
              href={`/ligue/${encodeURIComponent(league.slug)}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour à {league.name}
            </Link>

            <header className="mt-7 border-b border-border/70 pb-8 sm:mt-10 sm:pb-10">
              <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary sm:text-xs">
                {article.eyebrow}
              </p>
              <p className="mt-5 font-mono text-[0.68rem] font-black uppercase tracking-[0.18em] text-zinc-400 sm:text-xs">
                {article.kicker}
              </p>
              <h1 className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.35rem,11vw,5.9rem)] font-black uppercase leading-[0.93] tracking-normal text-white">
                {article.title}
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-zinc-300 sm:text-xl">
                {article.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-zinc-500">
                <span>Par {article.author}</span>
                <span className="text-primary" aria-hidden>
                  ·
                </span>
                <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
              </div>
            </header>

            {article.heroImage ? (
              <figure className="my-8 overflow-hidden border-y border-primary/30 sm:my-10">
                <Image
                  src={article.heroImage}
                  alt="L'entraîneur Seb, champion de Ligue 1"
                  width={1122}
                  height={1402}
                  priority
                  sizes="(min-width: 1024px) 960px, 100vw"
                  className="h-auto w-full object-cover sm:max-h-[760px]"
                />
              </figure>
            ) : null}

            <div className="mx-auto max-w-3xl space-y-6">
              {article.content.map((block, index) => (
                <ArticleBlock key={`${block.type}-${index}`} block={block} />
              ))}
            </div>

            <footer className="mx-auto mt-12 max-w-3xl border-t border-border/70 pt-6 sm:mt-16">
              <Link
                href={`/ligue/${encodeURIComponent(league.slug)}`}
                className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/80"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Retour à la Ligue 1
              </Link>
            </footer>
          </article>
        </main>
      </div>
    </div>
  )
}
