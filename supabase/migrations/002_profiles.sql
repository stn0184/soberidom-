-- SPEC.md 2.1 profiles — профили пользователей + is_admin() (SQL дословно из SPEC v1.3)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  country_code char(2) not null default 'RU',
  region_id uuid null, -- FK добавляется после создания regions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on profiles
  for each row execute procedure extensions.moddatetime(updated_at);

-- Автосоздание профиля при регистрации
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Хелпер: текущий пользователь admin? Создаётся после profiles (функция ссылается
-- на таблицу) и до RLS-политик ниже (политики ссылаются на функцию).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
-- insert делает триггер (security definer), delete каскадом от auth.users
