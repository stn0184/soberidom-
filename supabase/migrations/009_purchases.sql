-- SPEC.md 2.6 purchases, promo_codes (SQL дословно из SPEC v1.5; этап 4).
-- Остальные таблицы раздела 2.6 (user_prices, user_progress, user_expenses) — этап 5, миграция 010.
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references house_projects(id),
  code text not null unique,           -- 'SD-7F3K9Q'
  status text not null default 'pending' check (status in ('pending','active','rejected','refunded')),
  provider text not null default 'manual' check (provider in ('manual','promo','yookassa')),
  amount_minor integer not null,
  currency char(3) not null,
  config jsonb not null default '{}',  -- зафиксированная конфигурация на момент покупки: {"lumber":"dry","roofing":"metal_tile","finish_ext":"imitation","finish_int":"vagonka","foundation":"piles"}
  region_id uuid null references regions(id),
  activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_id)
);
create index idx_purchases_user on purchases(user_id);
create index idx_purchases_status on purchases(status);
create trigger set_updated_at before update on purchases
  for each row execute procedure extensions.moddatetime(updated_at);
alter table purchases enable row level security;
create policy "purch_select_own" on purchases for select using (user_id = auth.uid() or is_admin());
create policy "purch_insert_own" on purchases for insert with check (user_id = auth.uid() and status = 'pending');
create policy "purch_update_admin" on purchases for update using (is_admin()) with check (is_admin());
-- Пользователь может менять только config своей активной покупки:
create policy "purch_update_own_config" on purchases for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = (select status from purchases p where p.id = purchases.id));

create table promo_codes (
  code text primary key,
  project_id uuid null references house_projects(id), -- null = любой проект
  uses_left integer not null default 1 check (uses_left >= 0),
  expires_at timestamptz null
);
alter table promo_codes enable row level security;
create policy "promo_admin_all" on promo_codes for all using (is_admin()) with check (is_admin());
-- Гашение промокода — только через серверный роут с service_role.
