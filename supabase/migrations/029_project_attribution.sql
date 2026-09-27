-- Автор и лицензия планов проекта (спека 006). Планы Homesteader's Cabin взяты по
-- лицензии CC BY-NC 3.0 — она требует указать автора (Michael Janzen,
-- tinyhousedesign.com), а хранить его в house_projects было негде. Пустой
-- plan_author = атрибуция на витрине и в кабинете не показывается.
-- Идемпотентно: колонки добавляются только если их ещё нет.

alter table house_projects
  add column if not exists plan_author text not null default '',       -- 'Michael Janzen'
  add column if not exists plan_source_url text not null default '',   -- 'https://tinyhousedesign.com'
  add column if not exists plan_license text not null default '',      -- 'CC BY-NC 3.0'
  add column if not exists plan_license_url text not null default '';  -- ссылка на текст лицензии

-- Бэкфилл бесплатного эталона Homesteader's Cabin (ТЕХПАСПОРТ §7).
update house_projects
   set plan_author = 'Michael Janzen',
       plan_source_url = 'https://tinyhousedesign.com',
       plan_license = 'CC BY-NC 3.0',
       plan_license_url = 'https://creativecommons.org/licenses/by-nc/3.0/us/'
 where id = 'de300000-0000-4000-8000-000000000100'
   and plan_author = '';
