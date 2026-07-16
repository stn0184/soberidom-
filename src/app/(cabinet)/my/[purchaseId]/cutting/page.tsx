import type { Metadata } from 'next';
import { CuttingView } from '@/components/build/cutting-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.cutting.title} — ${ru.common.appName}`,
};

export default async function CuttingPage({ params }: Ctx) {
  const { purchaseId } = await params;
  return <CuttingView purchaseId={purchaseId} />;
}
