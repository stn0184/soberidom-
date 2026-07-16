import type { Metadata } from 'next';
import { StepsManager } from '@/components/admin/steps-manager';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.admin.nav.steps} — ${ru.admin.title} — ${ru.common.appName}`,
};

export default function AdminStepsPage() {
  return <StepsManager />;
}
