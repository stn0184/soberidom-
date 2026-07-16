'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/admin/form-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { parseAppliesWhen } from '@/lib/admin/form-utils';
import type { StageRow } from '@/lib/admin/types';
import { stageSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.stages;
const stageFormSchema = stageSchema.omit({ project_id: true, applies_when: true });
type StageFormValues = z.infer<typeof stageFormSchema>;

export function StageForm({
  projectId,
  stage,
  nextSort,
  onSaved,
}: {
  projectId: string;
  stage: StageRow | null;
  nextSort: number;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [appliesWhenText, setAppliesWhenText] = useState(
    JSON.stringify(stage?.applies_when ?? {})
  );
  const [appliesWhenError, setAppliesWhenError] = useState<string | null>(null);

  const form = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: stage
      ? {
          sort: stage.sort,
          code: stage.code,
          title: stage.title,
          intro: stage.intro,
          delivery_wave: stage.delivery_wave,
        }
      : { sort: nextSort, code: '', title: '', intro: '', delivery_wave: 2 },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: StageFormValues) {
    setServerError(null);
    const appliesWhen = parseAppliesWhen(appliesWhenText);
    if (appliesWhen === null) {
      setAppliesWhenError(ru.admin.common.invalidJson);
      return;
    }
    setAppliesWhenError(null);
    const payload = { ...values, applies_when: appliesWhen };
    try {
      if (stage) {
        await apiFetch(`/api/admin/stages/${stage.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/stages', {
          method: 'POST',
          body: JSON.stringify({ ...payload, project_id: projectId }),
        });
      }
      onSaved();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t.sort} htmlFor="s-sort" error={errors.sort?.message}>
          <Input id="s-sort" type="number" {...form.register('sort', { valueAsNumber: true })} />
        </FormField>
        <FormField label={t.deliveryWave} htmlFor="s-wave" error={errors.delivery_wave?.message}>
          <Input
            id="s-wave"
            type="number"
            min={1}
            max={5}
            {...form.register('delivery_wave', { valueAsNumber: true })}
          />
        </FormField>
      </div>
      <FormField label={t.code} htmlFor="s-code" error={errors.code?.message}>
        <Input id="s-code" {...form.register('code')} />
      </FormField>
      <FormField label={t.stageTitle} htmlFor="s-title" error={errors.title?.message}>
        <Input id="s-title" {...form.register('title')} />
      </FormField>
      <FormField label={t.intro} htmlFor="s-intro" error={errors.intro?.message}>
        <Textarea id="s-intro" rows={3} {...form.register('intro')} />
      </FormField>
      <FormField
        label={ru.admin.common.appliesWhen}
        htmlFor="s-aw"
        hint={ru.admin.common.appliesWhenHint}
        error={appliesWhenError ?? undefined}
      >
        <Textarea
          id="s-aw"
          rows={2}
          value={appliesWhenText}
          onChange={(e) => setAppliesWhenText(e.target.value)}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
