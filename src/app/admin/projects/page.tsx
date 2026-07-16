import type { Metadata } from 'next';
import { ProjectsTable } from '@/components/admin/projects-table';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.admin.nav.projects} — ${ru.admin.title} — ${ru.common.appName}`,
};

export default function AdminProjectsPage() {
  return <ProjectsTable />;
}
