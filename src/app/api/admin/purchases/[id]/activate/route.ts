import { NextResponse } from 'next/server';
import { apiError, dbError, requireAdmin } from '@/lib/api/helpers';
import { sendEmail } from '@/lib/email/send';
import { createServiceClient } from '@/lib/supabase/service';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ id: string }> };

// SPEC 3.16: активация покупки админом → status='active' + письмо (US-006 п.4).
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data: purchase, error } = await auth.supabase
    .from('purchases')
    .update({ status: 'active', activated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, house_projects(title)')
    .maybeSingle();
  if (error) return dbError(error);
  if (!purchase) return apiError('NOT_FOUND', ru.api.notFound);

  try {
    const service = createServiceClient();
    const { data: result } = await service.auth.admin.getUserById(purchase.user_id);
    if (result.user?.email) {
      await sendEmail(
        result.user.email,
        ru.email.activatedSubject,
        ru.email.activatedText(purchase.house_projects?.title ?? '')
      );
    }
  } catch {
    // письмо не должно блокировать активацию
  }

  return NextResponse.json({ data: { status: 'active' } });
}
