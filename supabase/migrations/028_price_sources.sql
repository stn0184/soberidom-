-- Цены с источником и датой (спека 005, фаза А разведки 2026-09-20).
-- material_prices перестаёт быть «одна цена на регион» и становится таблицей
-- предложений: у каждого — откуда оно и когда проверено; в смету идёт самое
-- дешёвое (src/lib/estimate/prices.ts). Без подписи цена снова «выдумана»,
-- поэтому подпись обязательна и на уровне БД.

alter table material_prices
  add column source_kind text not null default 'manual'
    check (source_kind in ('retailer','local_base','manual','ai_search')),
  add column retailer_id uuid null references retailers(id) on delete set null,
  add column source_label text not null default '',   -- 'Лемана ПРО', 'База «Лесторг», Тверь'
  add column source_url text not null default '',
  add column checked_at date not null default current_date;  -- дата UTC, как new Date() на Vercel

-- Старые строки — демо-цены без источника: подпись «демо», дата последней правки.
-- Старый unique гарантировал по одной такой строке на (материал, страна, регион),
-- поэтому новый индекс предложения они не нарушают.
update material_prices
   set source_label = 'демо',
       checked_at = updated_at::date
 where length(trim(source_label)) = 0;

alter table material_prices
  add constraint material_prices_source_label_check check (length(trim(source_label)) > 0);

-- На материал в регионе предложений может быть несколько; уникальна подпись.
-- coalesce вместо uuid_nil(): литерал не зависит от search_path расширения
-- uuid-ossp и так же иммутабелен, как требуется выражению индекса.
alter table material_prices
  drop constraint material_prices_material_id_country_code_region_id_key;
create unique index material_prices_offer_idx on material_prices (
  material_id,
  country_code,
  coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(trim(source_label))
);

-- Счётчик устаревших цен в админке (GET /api/admin/prices?stale=1).
create index idx_prices_checked_at on material_prices (checked_at);

comment on column material_prices.source_kind is 'retailer | local_base | manual | ai_search';
comment on column material_prices.checked_at is 'когда цену проверял человек; старше PRICE_STALE_DAYS — «давно»';
