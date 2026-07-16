-- Storage-бакеты этапа 2 (SPEC Приложение В этап 2; SPEC 4.14, 5.8).
-- ПРИМЕЧАНИЕ: в SPEC Блок 2 нет готового SQL для Storage — этот файл написан
-- по актуальной документации Supabase (bucket-настройки + RLS на storage.objects).
-- Параметры из SPEC 5.8: mime-whitelist image/webp,png,jpeg и model/gltf-binary; лимит 20 МБ.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 20971520, array['image/webp','image/png','image/jpeg']),
  ('models', 'models', true, 20971520, array['model/gltf-binary'])
on conflict (id) do nothing;

-- Чтение всем (публичные бакеты), запись/изменение/удаление — только admin (SPEC 5.8).
create policy "storage_read_all" on storage.objects for select
  using (bucket_id in ('public-assets','models'));
create policy "storage_admin_insert" on storage.objects for insert
  with check (bucket_id in ('public-assets','models') and public.is_admin());
create policy "storage_admin_update" on storage.objects for update
  using (bucket_id in ('public-assets','models') and public.is_admin())
  with check (bucket_id in ('public-assets','models') and public.is_admin());
create policy "storage_admin_delete" on storage.objects for delete
  using (bucket_id in ('public-assets','models') and public.is_admin());
