-- Инструмент = потребность + варианты (спека 004).
-- project_tools становится потребностью («Пилить доски»), а конкретные
-- ножовка/циркулярка/торцовка — строками tool_variants с ценой, скоростью
-- и объяснением. Покупатель выбирает вариант, выбор живёт в user_tool_choices.

-- Варианты инструмента под одну потребность
create table tool_variants (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references project_tools(id) on delete cascade,
  name text not null,                     -- 'Циркулярная пила'
  description text not null default '',   -- чем хорош и чем плох, простыми словами
  recommendation text not null check (recommendation in ('buy','rent','borrow_or_buy_cheap')),
  price_minor integer null check (price_minor >= 0),      -- ориентир покупки (null = только аренда)
  rent_day_minor integer null check (rent_day_minor >= 0),-- ориентир аренды/сутки (null = не арендуют)
  speed_note text not null default '',    -- 'в 5 раз медленнее', 'быстро и ровно'
  is_beginner_choice boolean not null default false, -- ровно один на потребность, следит форма админки
  sort smallint not null default 0
);
create index tool_variants_tool_idx on tool_variants (tool_id, sort);
alter table tool_variants enable row level security;
create policy "tvariants_read_all" on tool_variants for select using (true);
create policy "tvariants_admin" on tool_variants for all using (is_admin()) with check (is_admin());
-- Читается всеми — как project_tools: список инструмента показываем и на витрине.

-- Выбор покупателя: какой вариант он берёт под каждую потребность
create table user_tool_choices (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  tool_id uuid not null references project_tools(id) on delete cascade,
  variant_id uuid not null references tool_variants(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (purchase_id, tool_id)
);
create trigger set_updated_at before update on user_tool_choices
  for each row execute procedure extensions.moddatetime(updated_at);
alter table user_tool_choices enable row level security;
create policy "utools_own" on user_tool_choices for all
  using (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()))
  with check (exists (select 1 from purchases p where p.id = purchase_id and p.user_id = auth.uid()));
-- Админ удалил выбранный вариант — выбор исчезает каскадом, покупатель тихо
-- возвращается к варианту «советуем новичку».

-- Старые колонки project_tools не удаляем (существующее не ломаем), но новый
-- код их не пишет — значит нужны значения по умолчанию, иначе вставка потребности
-- из админки и сида упадёт на not null.
alter table project_tools alter column recommendation set default 'buy';
alter table project_tools alter column approx_price_minor set default 0;
alter table project_tools alter column reason set default '';
