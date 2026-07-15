import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ru } from '@/lib/i18n/ru';
import { AuthSkeleton } from '../auth-skeleton';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: `${ru.auth.login.title} — ${ru.common.appName}`,
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
