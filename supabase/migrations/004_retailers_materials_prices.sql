-- SPEC.md 2.3 retailers, materials, цены и артикулы (SQL дословно из SPEC v1.3)
create table retailers (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references countries(code),
  name text not null,                  -- 'Лемана ПРО'
  website text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on retailers
  for each row execute procedure extensions.moddatetime(updated_at);
alter table retailers enable row level security;
create policy "retailers_read_all" on retailers for select using (true);
create policy "retailers_admin_write" on retailers for all using (is_admin()) with check (is_admin());
insert into retailers (country_code,name,website) values
 ('RU','Лемана ПРО','https://lemanapro.ru'),('RU','СТД Петрович','https://petrovich.ru'),
 ('RU','Строительный Двор','https://sdvor.com'),('RU','ВсеИнструменты.ру','https://vseinstrumenti.ru'),
 ('KZ','Мегастрой','https://megastroy.kz'),('KZ','12 месяцев','https://12.kz'),
 ('BY','ОМА','https://oma.by'),('BY','Материк','https://materik.by');

create table materials (
  id uuid primary key default gen_random_uuid(),
  sku_internal text not null unique,   -- 'LMB-50150-6000-NAT'
  name text not null,                  -- 'Доска обрезная 50×150×6000, ест. влажности, сорт 1-2'
  category text not null check (category in ('lumber','sheet','insulation','roofing','fasteners','membrane','foundation','finish_ext','finish_int','engineering','tools','other')),
  unit text not null check (unit in ('pcs','m','m2','m3','kg','pack','set')),
  volume_m3 numeric(10,5) not null default 0,  -- объём единицы (для доставки)
  weight_kg numeric(10,3) not null default 0,  -- вес единицы
  lumber_moisture text null check (lumber_moisture in ('natural','dry')), -- только для category='lumber'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_materials_category on materials(category);
create trigger set_updated_at before update on materials
  for each row execute procedure extensions.moddatetime(updated_at);
alter table materials enable row level security;
create policy "materials_read_all" on materials for select using (true);
create policy "materials_admin_write" on materials for all using (is_admin()) with check (is_admin());

-- Дефолтные цены по странам (позже можно детализировать до региона: region_id nullable)
create table material_prices (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  country_code char(2) not null references countries(code),
  region_id uuid null references regions(id) on delete set null, -- null = вся страна
  price_minor integer not null check (price_minor >= 0),
  currency char(3) not null,
  updated_at timestamptz not null default now(),
  unique (material_id, country_code, region_id)
);
create index idx_prices_material on material_prices(material_id);
create trigger set_updated_at before update on material_prices
  for each row execute procedure extensions.moddatetime(updated_at);
alter table material_prices enable row level security;
create policy "prices_read_all" on material_prices for select using (true);
create policy "prices_admin_write" on material_prices for all using (is_admin()) with check (is_admin());

create table retailer_skus (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  retailer_id uuid not null references retailers(id) on delete cascade,
  sku text not null,
  product_url text not null default '',
  unique (material_id, retailer_id)
);
alter table retailer_skus enable row level security;
create policy "skus_read_all" on retailer_skus for select using (true);
create policy "skus_admin_write" on retailer_skus for all using (is_admin()) with check (is_admin());
