import type { Metadata } from 'next';
import { BuildView } from '@/components/build/build-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = {
  params: Promise<{ purchaseId: string }>;
  searchParams: Promise<{ stage?: string }>;
};

export const metadata: Metadata = {
  title: `${ru.build.title} — ${ru.common.appName}`,
};

export default async function BuildPage({ params, searchParams }: Ctx) {
  const { purchaseId } = await params;
  const { stage } = await searchParams;
  return <BuildView purchaseId={purchaseId} initialStageId={stage} />;
}
