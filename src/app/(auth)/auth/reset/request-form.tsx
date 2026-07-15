'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { ru } from '@/lib/i18n/ru';
import { resetRequestSchema, type ResetRequestInput } from '@/lib/zod/auth';

const t = ru.auth.reset;

export function RequestForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetRequestInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/auth/reset')}`,
    });
    if (error) {
      setServerError(ru.common.error);
      return;
    }
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.sentTitle}</CardTitle>
          <CardDescription>{t.sentText(sentTo)}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.requestTitle}</CardTitle>
        <CardDescription>{t.requestText}</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? ru.common.pleaseWait : t.requestSubmit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
