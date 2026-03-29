import { redirect } from "next/navigation"
import { listLeagues } from "@/lib/queries"

/**
 * Root URL redirects to the canonical league route.
 * Prefer NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG; if unset, uses the first league by name (dev fallback).
 */
export default async function HomePage() {
  const preferred = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG?.trim()

  if (preferred) {
    redirect(`/ligue/${encodeURIComponent(preferred)}`)
  }

  const leagues = await listLeagues()
  const first = leagues[0]
  if (first?.slug) {
    redirect(`/ligue/${encodeURIComponent(first.slug)}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Aucune ligue disponible</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ajoutez une ligue dans Supabase ou définissez{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_DEFAULT_LEAGUE_SLUG</code> une fois
        vos slugs connus.
      </p>
    </div>
  )
}
