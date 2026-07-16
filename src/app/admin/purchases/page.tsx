import type { Metadata } from 'next';
import { PurchasesTable } from '@/components/admin/purchases-table';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.admin.nav.purchases} — ${ru.admin.title} — ${ru.common.appName}`,
};

export default function AdminPurchasesPage() {
  return <PurchasesTable />;
}
