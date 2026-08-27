-- Nouvelle saison La Gazzatak : Saison 2026-2027 — Part 1
--
-- Important :
-- - Ne supprime et ne réaffecte aucun match, matchday, résultat, historique ou classement.
-- - Ne modifie la saison 2026 existante que pour la sortir du statut courant.
-- - La saison 2026 conserve `is_finished = true`.
-- - Ne crée aucun manager, aucune équipe, aucune journée et aucun match fictif.
-- - Ajoute une nouvelle ligne `seasons` par division existante, selon le modèle actuel :
--   `seasons.league_id -> leagues.id`.

BEGIN;

-- 1) Archiver le statut courant de la saison précédente pour les deux divisions.
--    Les autres champs restent inchangés, sauf `is_finished` explicitement maintenu à true.
UPDATE public.seasons s
SET
  is_current = false,
  is_finished = true
FROM public.leagues l
WHERE s.league_id = l.id
  AND l.slug IN ('jakattak_ligue1', 'jakattak_ligue2')
  AND s.name = '2026';

INSERT INTO public.seasons (
  id,
  league_id,
  name,
  total_matchdays,
  is_current,
  is_finished,
  created_at
)
SELECT
  '3c9a5b8c-7239-458b-8418-1de4a7defd9b'::uuid,
  l.id,
  'Saison 2026-2027 — Part 1',
  NULL,
  true,
  false,
  now()
FROM public.leagues l
WHERE l.slug = 'jakattak_ligue1'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seasons s
    WHERE s.id = '3c9a5b8c-7239-458b-8418-1de4a7defd9b'::uuid
  );

INSERT INTO public.seasons (
  id,
  league_id,
  name,
  total_matchdays,
  is_current,
  is_finished,
  created_at
)
SELECT
  '195a8fb5-a060-448c-9bd6-377daae0eb61'::uuid,
  l.id,
  'Saison 2026-2027 — Part 1',
  NULL,
  true,
  false,
  now()
FROM public.leagues l
WHERE l.slug = 'jakattak_ligue2'
  AND NOT EXISTS (
    SELECT 1
    FROM public.seasons s
    WHERE s.id = '195a8fb5-a060-448c-9bd6-377daae0eb61'::uuid
  );

CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_current_per_league
ON public.seasons (league_id)
WHERE is_current = true;

COMMIT;
