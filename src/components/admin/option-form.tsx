'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/admin/file-upload';
import { FormField } from '@/components/admin/form-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { ConfigOptionRow } from '@/lib/admin/types';
import { configOptionSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.options;
const formSchema = configOptionSchema.omit({ project_id: true });
type OptionFormValues = z.infer<typeof formSchema>;

// Редактор варианта конфигуратора: термин → картинка + объяснение + цена +
// «Совет новичку» (UX_PRINCIPLES п.2–3). Контент наполняет владелец.
export function OptionForm({
  projectId,
  option,
  onSaved,
}: {
  projectId: string;
  option: ConfigOptionRow | null;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<OptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: option
      ? {
          group_key: option.group_key,
          option_key: option.option_key,
          label: option.label,
          is_default: option.is_default,
          sort: option.sort,
          image_url: option.image_url,
          human_description: option.human_description,
          price_hint: option.price_hint,
          is_beginner_choice: option.is_beginner_choice,
          beginner_advice: option.beginner_advice,
        }
      : {
          group_key: 'lumber',
          option_key: '',
          label: '',
          is_default: false,
          sort: 0,
          image_url: '',
          human_description: '',
          price_hint: '',
          is_beginner_choice: false,
          beginner_advice: '',
        },
  });
  const { errors, isSubmitting } = form.formState;
  const groupKey = useWatch({ control: form.control, name: 'group_key' });
  const imageUrl = useWatch({ control: form.control, name: 'image_url' });
  const isDefault = useWatch({ control: form.control, name: 'is_default' });
  const isBeginner = useWatch({ control: form.control, name: 'is_beginner_choice' });

  async function onSubmit(values: OptionFormValues) {
    setServerError(null);
    try {
      if (option) {
        await apiFetch(`/api/admin/options/${option.id}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch('/api/admin/options', {
          method: 'POST',
          body: JSON.stringify({ ...values, project_id: projectId }),
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
        <FormField label={t.group} error={errors.group_key?.message}>
          <Select
            value={groupKey}
            onValueChange={(v) =>
              form.setValue('group_key', v as OptionFormValues['group_key'])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ru.project.groups).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t.sort} htmlFor="o-sort" error={errors.sort?.message}>
          <Input id="o-sort" type="number" {...form.register('sort', { valueAsNumber: true })} />
        </FormField>
      </div>

      <FormField label={t.optionKey} htmlFor="o-key" error={errors.option_key?.message}>
        <Input id="o-key" {...form.register('option_key')} />
      </FormField>
      <FormField label={t.label} htmlFor="o-label" error={errors.label?.message}>
        <Input id="o-label" {...form.register('label')} />
      </FormField>

      <div className="space-y-1.5">
        <Label>{t.image}</Label>
        <FileUpload
          bucket="public-assets"
          accept="image/webp,image/png,image/jpeg"
          value={imageUrl}
          onChange={(url) => form.setValue('image_url', url, { shouldDirty: true })}
        />
      </div>

      <FormField
        label={t.humanDescription}
        htmlFor="o-desc"
        error={errors.human_description?.message}
      >
        <Textarea id="o-desc" rows={2} {...form.register('human_description')} />
      </FormField>
      <FormField label={t.priceHint} htmlFor="o-price" error={errors.price_hint?.message}>
        <Input id="o-price" {...form.register('price_hint')} />
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={isDefault}
          onCheckedChange={(v) => form.setValue('is_default', v)}
        />
        {t.isDefault}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={isBeginner}
          onCheckedChange={(v) => form.setValue('is_beginner_choice', v)}
        />
        {t.isBeginner}
      </label>
      {isBeginner && (
        <FormField
          label={t.beginnerAdvice}
          htmlFor="o-advice"
          error={errors.beginner_advice?.message}
        >
          <Textarea id="o-advice" rows={2} {...form.register('beginner_advice')} />
        </FormField>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
