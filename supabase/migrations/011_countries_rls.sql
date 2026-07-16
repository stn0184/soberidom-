-- Hotfix: на countries включён RLS (Security Advisor дашборда) без политик —
-- справочник стал невидим для anon, из-за чего calcEstimate не определял валюту
-- и смета не считалась. Политики — по образцу остальных справочников SPEC 2.2.
-- Пробел SPEC (2.2 не задавал RLS для countries) — кандидат в пакет v1.6.
-- Таблицы кабинета (SPEC 2.6) сдвигаются в миграцию 012.
alter table countries enable row level security; -- идемпотентно: уже включён
create policy "countries_read_all" on countries for select using (true);
create policy "countries_admin_write" on countries for all using (is_admin()) with check (is_admin());
