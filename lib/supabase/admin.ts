import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Client Supabase avec la **clé service role** — réservé aux actions serveur
 * (ex. saisie admin des matchs). Ne jamais exposer cette clé au navigateur.
 *
 * Utilisé uniquement si `SUPABASE_SERVICE_ROLE_KEY` est défini.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
