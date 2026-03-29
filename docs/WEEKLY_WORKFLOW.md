# Workflow hebdomadaire — résultats de ligue

La table **`matches`** est la **seule source de vérité** pour le classement et les KPIs du dashboard (`/ligue/[slug]`). Chaque match pointe vers une journée via **`matchday_id`** ; la **saison** est portée par **`matchdays.season_id`** (il n’y a **pas** de `season_id` sur `matches`).

## Prérequis : table `matchdays`

Pour chaque journée de la saison, une ligne doit exister dans **`matchdays`** avec au minimum :

- `season_id` — UUID de la saison
- `number` — numéro affiché de la journée (1, 2, 3…)

L’app lit les matchs en filtrant `matches.matchday_id` sur les `matchdays.id` de cette saison, puis utilise `matchdays.number` comme **numéro de journée** pour le classement.

## Ce que vous saisissez (minimum)

Pour **chaque match** :

| Où | Champ | Description |
|----|--------|-------------|
| **`matches`** | `matchday_id` | UUID d’une ligne de **`matchdays`** (bonne saison) |
| **`matches`** | `home_team_id` | Équipe domicile (`teams.id`) |
| **`matches`** | `away_team_id` | Équipe extérieur (`teams.id`) |
| **`matches`** | `home_score` | Buts domicile (entier ≥ 0) |
| **`matches`** | `away_score` | Buts extérieur (entier ≥ 0) |

En pratique, vous choisissez souvent la **journée par son numéro** : le formulaire admin (`/admin/match-results`) résout `matchday_id` tout seul à partir de `matchdays` (`season_id` + `number`).

## Ce que l’application recalcule toute seule

- Historique de **classement** (points 3-1-0, buts pour/contre, rang par journée)
- **Forme** récente, **séries** de victoires / défaites
- Cartes **KPIs** (« Coach en feu », « Match de la journée », etc.)
- **Journée courante** dans le hero (dernier `matchdays.number` ayant des matchs pour la saison)

Aucune mise à jour manuelle de **`standings_history`** n’est nécessaire pour le dashboard.

---

## Option A — Supabase Table Editor

1. Vérifier que **`matchdays`** contient la journée (même `season_id`, bon `number`).
2. **Table `matches`** → **Insert row** (ou édition d’une ligne existante).
3. Renseigner **`matchday_id`** (sélecteur FK vers `matchdays`), équipes, scores — **pas** de `season_id` sur cette table.
4. Enregistrer, recharger `/ligue/[slug]`.

**Erreurs** : alerte rouge sur le dashboard (doublon, UUID invalide, `matchday_id` hors saison, scores non entiers, etc.).

---

## Option B — Formulaire `/admin/match-results`

1. Variables `.env.local` : `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_MATCH_ENTRY_SECRET`.
2. Choisir ligue, **numéro de journée** (résolution automatique vers `matchday_id`), équipes, scores.
3. Si la journée n’existe pas dans `matchdays`, le formulaire refuse l’enregistrement avec un message explicite.

---

## Checklist post-journée

- [ ] La journée existe dans **`matchdays`** pour la bonne `season_id`
- [ ] Tous les matchs sont dans **`matches`** avec le bon **`matchday_id`**
- [ ] Pas de doublon (même journée + même paire domicile / extérieur)
- [ ] Page ligue sans alerte rouge

Schéma SQL de référence : `scripts/002_matches_results.sql`.
