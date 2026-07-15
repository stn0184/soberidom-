'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { ru } from '@/lib/i18n/ru';
import { safeNext } from '@/lib/utils';
import { loginSchema, type LoginInput } from '@/lib/zod/auth';

const t = ru.auth.login;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const confirmFailed = searchParams.get('error') === 'confirm';
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      if (error.code === 'invalid_credentials') setServerError(t.invalidCredentials);
      else if (error.code === 'email_not_confirmed') setServerError(t.emailNotConfirmed);
      else if (error.status === 429) setServerError(t.tooManyAttempts);
      else setServerError(ru.common.error);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {confirmFailed && !serverError && (
            <Alert variant="destructive">
              <AlertDescription>{ru.auth.confirmError}</AlertDescription>
            </Alert>
          )}
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t.emailLabel}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Link className="text-sm underline" href="/auth/reset">
                {t.forgotPassword}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-6">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? ru.common.pleaseWait : t.submit}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t.noAccount}{' '}
            <Link className="underline" href={`/auth/register?next=${encodeURIComponent(next)}`}>
              {t.goRegister}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
