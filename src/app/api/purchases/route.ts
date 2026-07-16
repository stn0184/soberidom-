import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError, dbError, parseJson, validationError } from '@/lib/api/helpers';
import { sendEmail } from '@/lib/email/send';
import { generatePurchaseCode } from '@/lib/payments/code';
import { manualProvider } from '@/lib/payments/manual';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { purchaseSchema } from '@/lib/zod/purchase';
import { formatMoneyMinor } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

// SPEC 3.6: оформление покупки (auth). US-006, edge cases 11, 16, 20.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError('UNAUTHORIZED', ru.api.unauthorized);

  const parsed = purchaseSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;
  const db = supabase as unknown as SupabaseClient;

  const { data: project } = await db
    .from('house_projects')
    .select('id, title, price_minor, currency, is_free')
    .eq('id', input.projectId)
    .maybeSingle();
  if (!project) return apiError('NOT_FOUND', ru.api.projectNotFound);

  // Повторная покупка того же проекта → 409 (US-006, edge 16).
  const { data: existing } = await db
    .from('purchases')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('project_id', input.projectId)
    .maybeSingle();
  if (existing) {
    return apiError(
      'CONFLICT',
      existing.status === 'pending' ? ru.api.purchasePending : ru.api.alreadyPurchased
    );
  }

  // Юридическая фиксация согласия с дисклеймером — в config покупки (edge 20).
  const config = { ...input.config, disclaimer: 'accepted' };
  const baseRow = {
    user_id: user.id,
    project_id: project.id,
    amount_minor: project.price_minor,
    currency: project.currency,
    config,
    region_id: input.regionId,
  };

  // Промокод → мгновенная активация через service_role (SPEC 5.5, rate limit — edge 11).
  if (input.promoCode) {
    if (!rateLimit(`promo:${user.id}:${clientIp(request)}`, 10, 60_000)) {
      return apiError('RATE_LIMITED', ru.api.rateLimited);
    }
    const service = createServiceClient();
    const { data: promo } = await service
      .from('promo_codes')
      .select('*')
      .eq('code', input.promoCode)
      .gt('uses_left', 0)
      .maybeSingle();
    const nowIso = new Date().toISOString();
    const promoValid =
      promo &&
      (!promo.expires_at || promo.expires_at > nowIso) &&
      (!promo.project_id || promo.project_id === project.id);
    if (!promoValid) return apiError('VALIDATION_ERROR', ru.api.promoInvalid);

    // Гашение с защитой от гонки: декремент только при неизменном uses_left.
    const { data: redeemed } = await service
      .from('promo_codes')
      .update({ uses_left: promo.uses_left - 1 })
      .eq('code', promo.code)
      .eq('uses_left', promo.uses_left)
      .select('code')
      .maybeSingle();
    if (!redeemed) return apiError('VALIDATION_ERROR', ru.api.promoInvalid);

    const { data: purchase, error } = await service
      .from('purchases')
      .insert({
        ...baseRow,
        code: generatePurchaseCode(),
        status: 'active',
        provider: 'promo',
        activated_at: nowIso,
      })
      .select()
      .single();
    if (error) return dbError(error);

    if (user.email) {
      await sendEmail(
        user.email,
        ru.email.activatedSubject,
        ru.email.activatedText(project.title)
      );
    }
    return NextResponse.json(
      {
        data: {
          purchaseId: purchase.id,
          code: purchase.code,
          status: 'active',
          amountMinor: purchase.amount_minor,
          currency: purchase.currency,
        },
      },
      { status: 201 }
    );
  }

  // Обычная покупка: pending + инструкция оплаты. Код уникален (ретраи на 23505 по code).
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generatePurchaseCode();
    const { data: purchase, error } = await db
      .from('purchases')
      .insert({ ...baseRow, code, status: 'pending', provider: 'manual' })
      .select()
      .single();
    if (error) {
      if (error.code === '23505' && error.message.includes('code')) continue;
      if (error.code === '23505') return apiError('CONFLICT', ru.api.alreadyPurchased);
      return dbError(error);
    }
    const payInstructions = manualProvider.createPayment({
      code,
      amountMinor: purchase.amount_minor,
      currency: purchase.currency,
    });
    if (user.email) {
      await sendEmail(
        user.email,
        ru.email.createdSubject(code),
        ru.email.createdText(
          project.title,
          formatMoneyMinor(purchase.amount_minor, purchase.currency),
          code,
          payInstructions.url
        )
      );
    }
    return NextResponse.json(
      {
        data: {
          purchaseId: purchase.id,
          code,
          status: 'pending',
          amountMinor: purchase.amount_minor,
          currency: purchase.currency,
          payInstructions,
        },
      },
      { status: 201 }
    );
  }
  return apiError('INTERNAL', ru.api.internal);
}
