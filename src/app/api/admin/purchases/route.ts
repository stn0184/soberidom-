import { NextResponse, type NextRequest } from 'next/server';
import { dbError, requireAdmin } from '@/lib/api/helpers';
import { createServiceClient } from '@/lib/supabase/service';

// SPEC 3.16/4.14: список покупок для админа (код, email, проект, сумма, дата, статус).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const status = request.nextUrl.searchParams.get('status');

  let query = auth.supabase
    .from('purchases')
    .select('*, house_projects(title)')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return dbError(error);

  // Email пользователей — только через service_role (auth.users недоступна с RLS-клиента).
  const emails = new Map<string, string>();
  try {
    const service = createServiceClient();
    const userIds = [...new Set((data ?? []).map((p) => p.user_id as string))];
    await Promise.all(
      userIds.map(async (id) => {
        const { data: result } = await service.auth.admin.getUserById(id);
        if (result.user?.email) emails.set(id, result.user.email);
      })
    );
  } catch {
    // без SUPABASE_SERVICE_ROLE_KEY список работает, но без email
  }

  return NextResponse.json({
    data: (data ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      status: p.status,
      provider: p.provider,
      amountMinor: p.amount_minor,
      currency: p.currency,
      createdAt: p.created_at,
      projectTitle: p.house_projects?.title ?? '',
      email: emails.get(p.user_id) ?? '',
    })),
  });
}
