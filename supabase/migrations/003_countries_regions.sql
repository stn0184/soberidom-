-- SPEC.md 2.2 countries, regions — география и климат (SQL дословно из SPEC v1.3)
create table countries (
  code char(2) primary key,           -- 'RU','KZ','BY'
  name text not null,
  currency char(3) not null            -- 'RUB','KZT','BYN'
);
insert into countries values ('RU','Россия','RUB'),('KZ','Казахстан','KZT'),('BY','Беларусь','BYN');

create table regions (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references countries(code),
  name text not null,                  -- 'Москва', 'Алматы'
  mt numeric(5,1) not null,            -- сумма |отрицательных среднемесячных t°|, СП 131.13330 табл.5.1
  snow_region smallint not null check (snow_region between 1 and 8),  -- СП 20.13330
  wind_region smallint not null check (wind_region between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_regions_country on regions(country_code);
create trigger set_updated_at before update on regions
  for each row execute procedure extensions.moddatetime(updated_at);
alter table regions enable row level security;
create policy "regions_read_all" on regions for select using (true);
create policy "regions_admin_write" on regions for all using (is_admin()) with check (is_admin());

alter table profiles add constraint fk_profiles_region foreign key (region_id) references regions(id) on delete set null;
-- Сид (минимум для старта; полный список грузится админом CSV-импортом):
insert into regions (country_code,name,mt,snow_region,wind_region) values
 ('RU','Москва',37.1,3,1),('RU','Санкт-Петербург',24.8,3,2),('RU','Екатеринбург',49.0,3,1),
 ('RU','Новосибирск',63.3,4,3),('RU','Краснодар',5.0,2,4),('RU','Казань',44.9,4,2),
 ('KZ','Алматы',18.0,2,1),('KZ','Астана',60.0,3,3),('BY','Минск',20.0,2,1);
