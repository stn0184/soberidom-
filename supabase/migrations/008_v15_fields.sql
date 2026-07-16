-- SPEC.md v1.5: поля is_free (house_projects) и display_name/color (stages).
-- ALTER-скрипт — из SPEC Блок 2 (вводная часть, миграция 008 для баз, созданных до v1.5).
alter table house_projects add column is_free boolean not null default false;
alter table stages add column display_name text not null default '';
alter table stages add column color text null check (color in ('red','green','yellow','blue','orange','purple'));
