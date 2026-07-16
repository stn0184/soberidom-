import { NextResponse } from 'next/server';
import { requireOwnerPurchase } from '@/lib/api/helpers';
import { calcWaves } from '@/lib/delivery/waves';
import { CURRENCY_COUNTRY, DELIVERY_AVG_COST } from '@/lib/constants';

type Ctx = { params: Promise<{ purchaseId: string }> };

// SPEC 3.14: волны доставки. Экономия = (доставок по этапам − волн) × средняя
// стоимость доставки по стране (SPEC 5.7, константы DELIVERY_AVG_COST).
export async function GET(_request: Request, { params }: Ctx) {
  const { purchaseId } = await params;
  const auth = await requireOwnerPurchase(purchaseId);
  if ('error' in auth) return auth.error;
  const { supabase: db, purchase } = auth;

  const result = await calcWaves(db, {
    projectId: purchase.project_id,
    config: purchase.config ?? {},
  });

  const country = CURRENCY_COUNTRY[purchase.currency] ?? 'RU';
  const savedDeliveries = Math.max(0, result.stagesWithMaterials - result.waves.length);
  return NextResponse.json({
    data: { waves: result.waves },
    meta: {
      savedDeliveries,
      savingsMinor: savedDeliveries * DELIVERY_AVG_COST[country],
      currency: purchase.currency,
      wavesCount: result.waves.length,
    },
  });
}
