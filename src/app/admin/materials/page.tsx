import type { Metadata } from 'next';
import { MaterialsTable } from '@/components/admin/materials-table';
import { PricesImport } from '@/components/admin/prices-import';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.admin.nav.materials} — ${ru.admin.title} — ${ru.common.appName}`,
};

export default function AdminMaterialsPage() {
  return (
    <>
      {/* Над таблицей — сколько цен устарело и импорт прайса (спека 005). */}
      <PricesImport />
      <MaterialsTable />
    </>
  );
}
