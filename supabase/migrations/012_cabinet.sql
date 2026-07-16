-- SPEC.md 2.6 user_prices, user_progress, user_expenses (SQL дословно из SPEC v1.5; этап 5)
-- + materials.storage_tip — подсказка по хранению (требование владельца, HANDOFF раздел 8).
create table user_prices (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  material_id uuid not null references materials(id),
  price_minor integer not null check (price_minor >= 0),
  updated_at timestamptz not null default now(),
  unique (purchase_id, material_id)
);
create trigger set_updated_at before update on user_prices
  for each row execute procedure extensions.moddatetime(updated_at);
alter table user_prices enable row level security;
create policy "uprices_own" on user_prices for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));

create table user_progress (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  step_id uuid not null references steps(id) on delete cascade,
  done_at timestamptz not null default now(),
  unique (purchase_id, step_id)
);
alter table user_progress enable row level security;
create policy "uprog_own" on user_progress for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));

create table user_expenses (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  material_id uuid null references materials(id),  -- null = произвольная трата
  custom_title text not null default '',
  stage_id uuid null references stages(id),
  qty numeric(12,3) not null default 1,
  amount_minor integer not null check (amount_minor >= 0),
  currency char(3) not null,
  spent_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (material_id is not null or custom_title <> '')
);
create index idx_expenses_purchase on user_expenses(purchase_id);
create trigger set_updated_at before update on user_expenses
  for each row execute procedure extensions.moddatetime(updated_at);
alter table user_expenses enable row level security;
create policy "uexp_own" on user_expenses for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));

-- Подсказка по хранению материала («добрый проводник» бережёт материалы новичка).
alter table materials add column storage_tip text not null default '';
