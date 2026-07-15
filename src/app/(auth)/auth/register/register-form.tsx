'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { ru } from '@/lib/i18n/ru';
import { safeNext } from '@/lib/utils';
import { registerSchema } from '@/lib/zod/auth';

// pdConsent в схеме — literal(true) (SPEC 5.1); в форме поле живёт как boolean.
type RegisterFormValues = Omit<z.infer<typeof registerSchema>, 'pdConsent'> & {
  pdConsent: boolean;
};

const resolver = zodResolver(registerSchema) as Resolver<RegisterFormValues>;
const t = ru.auth.register;

export function RegisterForm() {
  const next = safeNext(useSearchParams().get('next'));
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver,
    defaultValues: { name: '', email: '', password: '', pdConsent: false },
  });
  const { errors, isSubmitting } = form.formState;
  const pdConsent = useWatch({ control: form.control, name: 'pdConsent' });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    setEmailTaken(false);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      if (error.code === 'user_already_exists') setEmailTaken(true);
      else setServerError(ru.common.error);
      return;
    }
    // Подтверждение email включено: для занятого email Supabase возвращает
    // пользователя без identities — трактуем как «email уже зарегистрирован».
    if (data.user && data.user.identities?.length === 0) {
      setEmailTaken(true);
      return;
    }
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.checkEmailTitle}</CardTitle>
          <CardDescription>{t.checkEmailText(sentTo)}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {emailTaken && (
            <Alert variant="destructive">
              <AlertTitle>{t.emailTaken}</AlertTitle>
              <AlertDescription className="flex gap-3">
                <Link className="underline" href={`/auth/login?next=${encodeURIComponent(next)}`}>
                  {t.goLogin}
                </Link>
                <Link className="underline" href="/auth/reset">
                  {t.goReset}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t.nameLabel}</Label>
            <Input id="name" autoComplete="name" {...form.register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.emailLabel}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="pdConsent"
              checked={pdConsent}
              onCheckedChange={(checked) =>
                form.setValue('pdConsent', checked === true, { shouldValidate: true })
              }
            />
            <Label htmlFor="pdConsent" className="text-sm font-normal leading-snug">
              {t.pdConsentLabel}
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-6">
          <Button type="submit" className="w-full" disabled={!pdConsent || isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? ru.common.pleaseWait : t.submit}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t.haveAccount}{' '}
            <Link className="underline" href={`/auth/login?next=${encodeURIComponent(next)}`}>
              {t.goLogin}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
