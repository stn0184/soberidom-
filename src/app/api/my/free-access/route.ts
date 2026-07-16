import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { apiError, dbError, parseJson, validationError } from '@/lib/api/helpers';
import { generatePurchaseCode } from '@/lib/payments/code';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ru } from '@/lib/i18n/ru';

const schema = z.object({ projectId: z.uuid() });

// v1.5: доступ к is_free-проекту без оплаты. Создаёт «нулевую» активную покупку —
// на ней живут прогресс, свои цены и траты (все user_* таблицы ссылаются на purchases).
export async function POST(request: NextRequest) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return apiError('UNAUTHORIZED', ru.api.unauthorized);

  const parsed = schema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const db = client as unknown as SupabaseClient;

  const { data: project } = await db
    .from('house_projects')
    .select('id, is_free, currency')
    .eq('id', parsed.data.projectId)
    .eq('status', 'published')
    .maybeSingle();
  if (!project || !project.is_free) return apiError('NOT_FOUND', ru.api.projectNotFound);

  const { data: existing } = await db
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', project.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ data: { purchaseId: existing.id } });

  // Дефолтная конфигурация проекта фиксируется в покупке (как при обычной покупке).
  const { data: options } = await db
    .from('config_options')
    .select('group_key, option_key, is_default')
    .eq('project_id', project.id);
  const config: Record<string, string> = {};
  for (const o of options ?? []) {
    if (o.is_default) config[o.group_key] = o.option_key;
  }

  // insert через service_role: RLS разрешает пользователю только status='pending'.
  const service = createServiceClient();
  const { data: purchase, error } = await service
    .from('purchases')
    .insert({
      user_id: user.id,
      project_id: project.id,
      code: generatePurchaseCode(),
      status: 'active',
      provider: 'manual',
      amount_minor: 0,
      currency: project.currency,
      config,
      activated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: raced } = await db
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('project_id', project.id)
        .maybeSingle();
      if (raced) return NextResponse.json({ data: { purchaseId: raced.id } });
    }
    return dbError(error);
  }
  return NextResponse.json({ data: { purchaseId: purchase.id } }, { status: 201 });
}
