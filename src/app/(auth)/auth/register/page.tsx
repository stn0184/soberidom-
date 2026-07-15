import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ru } from '@/lib/i18n/ru';
import { AuthSkeleton } from '../auth-skeleton';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: `${ru.auth.register.title} — ${ru.common.appName}`,
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}
