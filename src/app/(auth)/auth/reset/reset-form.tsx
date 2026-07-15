'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthSkeleton } from '../auth-skeleton';
import { NewPasswordForm } from './new-password-form';
import { RequestForm } from './request-form';

// Один экран /auth/reset (SPEC 5.4): без сессии — запрос ссылки на email;
// с сессией (переход по ссылке восстановления) — форма нового пароля.
export function ResetForm() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setChecking(false);
    });
  }, []);

  if (checking) return <AuthSkeleton />;
  return hasSession ? <NewPasswordForm /> : <RequestForm />;
}
