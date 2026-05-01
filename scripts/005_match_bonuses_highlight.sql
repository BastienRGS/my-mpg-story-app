-- À exécuter manuellement dans Supabase après déploiement.
alter table public.match_bonuses
  add column if not exists highlight boolean default false;
