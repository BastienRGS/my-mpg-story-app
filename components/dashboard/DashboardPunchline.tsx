type Props = {
  punchline: string | null
}

export function DashboardPunchline({ punchline }: Props) {
  if (!punchline?.trim()) return null

  return (
    <section className="space-y-3" aria-labelledby="punchline-quote">
      <figure className="border-l-4 border-primary bg-primary/5 px-5 py-6 sm:px-7 sm:py-8">
        <blockquote
          id="punchline-quote"
          className="text-pretty text-xl font-medium italic leading-snug text-foreground sm:text-2xl lg:text-[1.65rem] lg:leading-snug"
        >
          « {punchline.trim()} »
        </blockquote>
        <figcaption className="section-label mt-5">Punchline de la semaine</figcaption>
      </figure>
    </section>
  )
}
