import type { Metadata } from 'next';
import { RegionsTable } from '@/components/admin/regions-table';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.admin.nav.regions} — ${ru.admin.title} — ${ru.common.appName}`,
};

export default function AdminRegionsPage() {
  return <RegionsTable />;
}
