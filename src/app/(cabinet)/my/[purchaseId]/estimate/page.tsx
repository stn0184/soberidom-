import type { Metadata } from 'next';
import { EstimateView } from '@/components/estimate/estimate-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.liveEstimate.title} — ${ru.common.appName}`,
};

export default async function LiveEstimatePage({ params }: Ctx) {
  const { purchaseId } = await params;
  return <EstimateView purchaseId={purchaseId} />;
}
