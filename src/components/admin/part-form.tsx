'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/admin/form-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { parseAppliesWhen } from '@/lib/admin/form-utils';
import type { MaterialRow, PartRow } from '@/lib/admin/types';
import { partSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.parts;
const partFormSchema = partSchema.omit({ project_id: true, applies_when: true });
type PartFormValues = z.infer<typeof partFormSchema>;

export function PartForm({
  projectId,
  part,
  materials,
  onSaved,
}: {
  projectId: string;
  part: PartRow | null;
  materials: MaterialRow[];
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [appliesWhenText, setAppliesWhenText] = useState(
    JSON.stringify(part?.applies_when ?? {})
  );
  const [appliesWhenError, setAppliesWhenError] = useState<string | null>(null);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: part
      ? {
          part_code: part.part_code,
          color: part.color,
          material_id: part.material_id,
          cut_length_mm: part.cut_length_mm,
          qty: part.qty,
        }
      : { part_code: '', color: 'red', material_id: '', cut_length_mm: 0, qty: 1 },
  });
  const { errors, isSubmitting } = form.formState;
  const color = useWatch({ control: form.control, name: 'color' });
  const materialId = useWatch({ control: form.control, name: 'material_id' });

  async function onSubmit(values: PartFormValues) {
    setServerError(null);
    const appliesWhen = parseAppliesWhen(appliesWhenText);
    if (appliesWhen === null) {
      setAppliesWhenError(ru.admin.common.invalidJson);
      return;
    }
    setAppliesWhenError(null);
    const payload = { ...values, applies_when: appliesWhen };
    try {
      if (part) {
        await apiFetch(`/api/admin/parts/${part.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/parts', {
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
        <FormField label={t.partCode} htmlFor="pt-code" error={errors.part_code?.message}>
          <Input id="pt-code" {...form.register('part_code')} />
        </FormField>
        <FormField label={t.color} error={errors.color?.message}>
          <Select
            value={color}
            onValueChange={(v) => form.setValue('color', v as PartFormValues['color'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.colors).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t.cutLengthMm} htmlFor="pt-len" error={errors.cut_length_mm?.message}>
          <Input
            id="pt-len"
            type="number"
            {...form.register('cut_length_mm', { valueAsNumber: true })}
          />
        </FormField>
        <FormField label={t.qty} htmlFor="pt-qty" error={errors.qty?.message}>
          <Input id="pt-qty" type="number" {...form.register('qty', { valueAsNumber: true })} />
        </FormField>
      </div>

      <FormField label={t.material} error={errors.material_id?.message}>
        <Select
          value={materialId}
          onValueChange={(v) => form.setValue('material_id', v, { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField
        label={ru.admin.common.appliesWhen}
        htmlFor="pt-aw"
        hint={ru.admin.common.appliesWhenHint}
        error={appliesWhenError ?? undefined}
      >
        <Textarea
          id="pt-aw"
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
