-- SPEC.md 2.4 house_projects, конфигурация, этапы, шаги, детали, BOM (SQL дословно из SPEC v1.3)
create table house_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,           -- 'dom-6x8-odnoetazhny'
  title text not null,                 -- 'Дом 6×8 одноэтажный «Старт»'
  building_type text not null check (building_type in ('house','banya','hozblok','garage')),
  style text not null default 'classic' check (style in ('classic','barnhouse','scandinavian','a_frame','chalet','mini')),
  -- classic: двускатная классика; barnhouse: барн с односкатной/асимметричной кровлей;
  -- scandinavian: сканди с панорамным остеклением; a_frame: треугольный;
  -- chalet: шале с широкими свесами; mini: мини-дом/дубль-дом до 40 м²
  floors smallint not null check (floors in (1,2)),
  area_m2 numeric(6,1) not null,
  rooms smallint not null,
  footprint text not null,             -- '6×8 м'
  heating_options text[] not null default '{electric,solid_fuel}', -- допустимые: gas, electric, solid_fuel
  max_snow_region smallint not null default 5,  -- проект рассчитан до этого снегового района включительно
  layout_notes jsonb not null default '[]',
  -- пример: [{"title":"Мокрые зоны рядом","text":"Санузел и кухня на одной стене — короткая разводка воды"}]
  description text not null default '',
  price_minor integer not null,        -- цена полного разбора
  currency char(3) not null default 'RUB',
  cover_image_url text not null default '',
  gallery_urls text[] not null default '{}',
  model_glb_url text not null default '',      -- Supabase Storage, слои по именам узлов: frame/roof/exterior/interior
  isometric_fallback_url text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  sp_compliant boolean not null default true,   -- бейдж СП 31-105-2002
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_projects_status on house_projects(status);
create trigger set_updated_at before update on house_projects
  for each row execute procedure extensions.moddatetime(updated_at);
alter table house_projects enable row level security;
create policy "projects_read_published" on house_projects for select using (status='published' or is_admin());
create policy "projects_admin_write" on house_projects for all using (is_admin()) with check (is_admin());

-- Группы опций конфигуратора и опции
create table config_options (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  group_key text not null check (group_key in ('lumber','roofing','finish_ext','finish_int','foundation')),
  option_key text not null,            -- 'natural','dry','metal_tile','ondulin','proflist','imitation','siding','planken','vagonka','paint_ready','piles','mzlf','columnar'
  label text not null,                 -- 'Сухая строганая доска'
  is_default boolean not null default false,
  sort smallint not null default 0,
  unique (project_id, group_key, option_key)
);
alter table config_options enable row level security;
create policy "cfg_read_all" on config_options for select using (true);
create policy "cfg_admin_write" on config_options for all using (is_admin()) with check (is_admin());

create table stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  sort smallint not null,
  code text not null,                  -- 'foundation','frame_floor','wall_s1',...
  title text not null,                 -- 'Этап 3. Стена S1 (фасад с окном)'
  intro text not null default '',      -- простое объяснение, что будет на этапе
  delivery_wave smallint not null default 2 check (delivery_wave between 1 and 5),
  applies_when jsonb not null default '{}',  -- условие показа, напр. {"foundation":"mzlf"}; {} = всегда
  unique (project_id, code)
);
create index idx_stages_project on stages(project_id, sort);
alter table stages enable row level security;
create policy "stages_read_all" on stages for select using (true);
create policy "stages_admin_write" on stages for all using (is_admin()) with check (is_admin());

create table steps (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  sort smallint not null,
  title text not null,                       -- 'Соберите нижнюю обвязку'
  why_text text not null default '',         -- «Зачем этот шаг» — обязателен для публикации
  prep_text text not null default '',        -- «Подготовьте» (накануне/до начала)
  image_url text not null default '',        -- схема шага
  actions jsonb not null default '[]',       -- ["Разложите доски A-1 и A-2 на ровной площадке", ...]
  tools text[] not null default '{}',        -- ['молоток','угольник','шуруповёрт']
  safety_text text not null default '',      -- правило безопасности, если есть риск
  duration_min_solo smallint null,           -- минуты одному
  duration_min_pair smallint null,           -- минуты вдвоём
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  weather_note text not null default '',     -- 'Не начинайте перед дождём: нужно 4 сухих часа'
  self_check jsonb not null default '[]',    -- ["Диагонали различаются ≤ 5 мм?", "Гвозди добиты заподлицо?"]
  hint text not null default '',             -- Подсказка
  common_mistake text not null default '',   -- Частая ошибка
  helpers_needed smallint not null default 0,
  is_practice boolean not null default false,   -- тренировочный шаг (можно пропустить кнопкой «У меня есть опыт»)
  is_mandatory boolean not null default false,  -- нельзя пропустить (шаг «Техника безопасности»)
  applies_when jsonb not null default '{}'
);
-- Валидация публикации (админ-линтер, 5.10): why_text<>'', self_check не пуст, duration задан.
create index idx_steps_stage on steps(stage_id, sort);
alter table steps enable row level security;
create policy "steps_read_all" on steps for select using (true);
create policy "steps_admin_write" on steps for all using (is_admin()) with check (is_admin());

-- Детали (доски с маркировкой) — для раскроя и блока «Возьмите» в шаге
create table parts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  part_code text not null,             -- 'B-12'
  color text not null check (color in ('red','green','yellow','blue','orange','purple')),
  material_id uuid not null references materials(id),  -- из какой заготовки режется
  cut_length_mm integer not null,      -- 2440
  qty integer not null check (qty > 0),
  applies_when jsonb not null default '{}',   -- напр. {"lumber":"dry"} — если детали различаются по опции
  unique (project_id, part_code)
);
alter table parts enable row level security;
create policy "parts_read_all" on parts for select using (true);
create policy "parts_admin_write" on parts for all using (is_admin()) with check (is_admin());

-- Инструменты проекта: купить или арендовать
create table project_tools (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  name text not null,                    -- 'Циркулярная пила'
  category text not null check (category in ('measure','hand','power','level','safety','special')),
  recommendation text not null check (recommendation in ('buy','rent','borrow_or_buy_cheap')),
  reason text not null,                  -- 'Нужна каждый день 2 месяца — аренда выйдет дороже покупки'
  approx_price_minor integer not null,   -- ориентир покупки
  approx_rent_day_minor integer null,    -- ориентир аренды/сутки (null = не арендуют)
  days_needed smallint not null,         -- на сколько дней реально нужен
  alternative text not null default '',  -- 'Нет циркулярки — ножовка: медленнее в 5 раз, но работает'
  stage_codes text[] not null default '{}',
  sort smallint not null default 0
);
alter table project_tools enable row level security;
create policy "ptools_read_all" on project_tools for select using (true);
create policy "ptools_admin" on project_tools for all using (is_admin()) with check (is_admin());
-- Читается всеми: список инструмента показываем и на витрине (это продаёт), детали buy/rent — в кабинете.

-- Связка шаг ↔ детали и крепёж
create table step_parts (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references steps(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  qty integer not null check (qty > 0)
);
create table step_materials (           -- крепёж/расходники прямо в шаге
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references steps(id) on delete cascade,
  material_id uuid not null references materials(id),
  qty numeric(10,3) not null check (qty > 0)
);
alter table step_parts enable row level security;
alter table step_materials enable row level security;
create policy "sp_read_all" on step_parts for select using (true);
create policy "sp_admin" on step_parts for all using (is_admin()) with check (is_admin());
create policy "sm_read_all" on step_materials for select using (true);
create policy "sm_admin" on step_materials for all using (is_admin()) with check (is_admin());

-- BOM: полная потребность материалов по этапам с условиями конфигурации
create table bom_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references house_projects(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  material_id uuid not null references materials(id),
  qty numeric(12,3) not null check (qty > 0),
  applies_when jsonb not null default '{}'
  -- пример: {"roofing":"metal_tile"} — позиция входит в смету только при этой опции
);
create index idx_bom_project on bom_items(project_id);
alter table bom_items enable row level security;
create policy "bom_read_all" on bom_items for select using (true);
create policy "bom_admin_write" on bom_items for all using (is_admin()) with check (is_admin());
