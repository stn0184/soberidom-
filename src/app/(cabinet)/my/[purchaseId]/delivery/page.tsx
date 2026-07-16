import type { Metadata } from 'next';
import { DeliveryView } from '@/components/build/delivery-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.delivery.title} — ${ru.common.appName}`,
};

export default async function DeliveryPage({ params }: Ctx) {
  const { purchaseId } = await params;
  return <DeliveryView purchaseId={purchaseId} />;
}
