import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { calcEstimateDetailed } from '@/lib/estimate/detailed';
import { apiError } from '@/lib/api/helpers';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.11: живая смета с user_prices, артикулами и отметками «куплено».
// У бесплатных покупок region_id может быть пуст → meta.needRegion (клиент попросит город).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  if (!purchase.region_id) {
    return NextResponse.json({ data: null, meta: { needRegion: true } });
  }

  const estimate = await calcEstimateDetailed(db, {
    projectId: purchase.project_id,
    config: purchase.config ?? {},
    regionId: purchase.region_id,
    purchaseId,
  });
  if (!estimate) return apiError('INTERNAL', ru.api.internal);

  return NextResponse.json({ data: estimate, meta: { needRegion: false } });
}
