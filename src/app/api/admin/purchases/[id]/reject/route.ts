import { NextResponse } from 'next/server';
import { apiError, dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { sendEmail } from '@/lib/email/send';
import { createServiceClient } from '@/lib/supabase/service';
import { rejectSchema } from '@/lib/zod/purchase';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ id: string }> };

// SPEC 3.16: отклонение покупки с причиной (письмо пользователю, SPEC 5.5).
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = rejectSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const { data: purchase, error } = await auth.supabase
    .from('purchases')
    .update({ status: 'rejected' })
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
        ru.email.rejectedSubject,
        ru.email.rejectedText(purchase.house_projects?.title ?? '', parsed.data.reason)
      );
    }
  } catch {
    // письмо не должно блокировать отклонение
  }

  return NextResponse.json({ data: { status: 'rejected' } });
}
