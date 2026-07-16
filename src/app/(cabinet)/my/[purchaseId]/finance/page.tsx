import type { Metadata } from 'next';
import { FinanceView } from '@/components/finance/finance-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.finance.title} — ${ru.common.appName}`,
};

export default async function FinancePage({ params }: Ctx) {
  const { purchaseId } = await params;
  return <FinanceView purchaseId={purchaseId} />;
}
