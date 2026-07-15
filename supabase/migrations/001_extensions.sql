-- SPEC.md 2.0 Расширения и служебное (SQL дословно из SPEC v1.3)
create extension if not exists moddatetime schema extensions;
-- Хелпер is_admin() создаётся в 002 после таблицы profiles (SPEC 2.1):
-- функция ссылается на profiles, и при check_function_bodies=on
-- её создание до таблицы завершилось бы ошибкой.
