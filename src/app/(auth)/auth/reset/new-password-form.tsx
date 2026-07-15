'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { newPasswordSchema, type NewPasswordInput } from '@/lib/zod/auth';

const t = ru.auth.reset;

export function NewPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: NewPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(ru.common.error);
      return;
    }
    setUpdated(true);
  }

  if (updated) {
    return (
      <Card>
        <CardHeader>
          <Alert>
            <AlertTitle>{t.updatedTitle}</AlertTitle>
            <AlertDescription>{t.updatedText}</AlertDescription>
          </Alert>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/">{ru.common.goHome}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.newTitle}</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">{t.newPasswordLabel}</Label>
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
        </CardContent>
        <CardFooter className="pt-6">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? ru.common.pleaseWait : t.newSubmit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
