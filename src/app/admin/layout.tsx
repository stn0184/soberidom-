import { notFound, redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

// Доступ только role='admin': RLS + проверка в layout (US-014).
// Не-админу отдаём 404, не раскрывая существование раздела.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') notFound();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r p-4">
        <div className="mb-6 px-3 text-lg font-semibold">{ru.admin.title}</div>
        <AdminSidebar />
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
