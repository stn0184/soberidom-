-- UX-этап «Ведём за руку» (UX_PRINCIPLES.md, п.2–3): человеческий показ вариантов
-- конфигуратора. Контент полей редактируется владельцем в админке, не хардкодится.
-- ПРИМЕЧАНИЕ: номер 010 занят этим UX-этапом; таблицы кабинета (user_prices,
-- user_progress, user_expenses из SPEC 2.6) уходят в миграцию 011 (этап 5).
alter table config_options add column image_url text not null default '';           -- картинка варианта (Storage public-assets)
alter table config_options add column human_description text not null default '';   -- «что это» простым языком
alter table config_options add column price_hint text not null default '';          -- текст цены, напр. «от 400 ₽/м²»
alter table config_options add column is_beginner_choice boolean not null default false; -- плашка «⭐ Совет новичку»
alter table config_options add column beginner_advice text not null default '';     -- текст совета новичку
