import type { Metadata } from 'next';
import { ru } from '@/lib/i18n/ru';
import { ResetForm } from './reset-form';

export const metadata: Metadata = {
  title: `${ru.auth.reset.requestTitle} — ${ru.common.appName}`,
};

export default function ResetPage() {
  return <ResetForm />;
}
