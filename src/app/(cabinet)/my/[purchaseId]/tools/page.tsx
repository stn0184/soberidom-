import type { Metadata } from 'next';
import { ToolsView } from '@/components/build/tools-view';
import { ru } from '@/lib/i18n/ru';

type Ctx = { params: Promise<{ purchaseId: string }> };

export const metadata: Metadata = {
  title: `${ru.tools.title} — ${ru.common.appName}`,
};

export default async function ToolsPage({ params }: Ctx) {
  const { purchaseId } = await params;
  return <ToolsView purchaseId={purchaseId} />;
}
