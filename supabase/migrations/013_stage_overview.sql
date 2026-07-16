-- Обзорный экран стройки «карта путешествия» (ВИДЕНИЕ_и_ПРИОРИТЕТЫ.md, раздел 2.1):
-- у этапа появляются примерная длительность и картинка результата «должно получиться вот так».
alter table stages add column duration_days smallint null;          -- примерная длительность этапа, дней
alter table stages add column result_image_url text not null default ''; -- фото/рендер результата этапа
