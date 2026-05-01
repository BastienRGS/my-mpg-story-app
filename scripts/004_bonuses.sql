create table public.match_bonuses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  manager_id uuid references public.managers(id),
  bonus_type text not null,
  bonus_outcome text not null,
  created_at timestamptz default now()
);

-- bonus_type values:
-- 'zahia' | 'suarez' | 'cheat_code' | '4decat' | 'miroir'
-- 'tonton_pat' | 'valise_nanard' | 'mcdo_plus' | 'capitaine'

-- bonus_outcome values:
-- 'win' | 'loss_or_draw' | 'mirror_wasted' | 'mirror_genius'
-- 'mirror_draw' | 'no_goal_to_cancel'

alter table public.match_bonuses enable row level security;
create policy "public read match_bonuses"
  on public.match_bonuses for select to anon using (true);
