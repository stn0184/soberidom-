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
import { ToolVariantsField, type VariantDraft } from '@/components/admin/tool-variants-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { saveVariants } from '@/lib/admin/tool-variants-save';
import type { ToolVariantRow, ToolWithVariants } from '@/lib/admin/types';
import { toolSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.tools;
const toolFormSchema = toolSchema.omit({ project_id: true, stage_codes: true });
type ToolFormValues = z.infer<typeof toolFormSchema>;

const toDraft = (row: ToolVariantRow): VariantDraft => ({
  id: row.id,
  name: row.name,
  description: row.description,
  recommendation: row.recommendation,
  priceText: row.price_minor === null ? '' : String(row.price_minor),
  rentDayText: row.rent_day_minor === null ? '' : String(row.rent_day_minor),
  speedNote: row.speed_note,
  isBeginnerChoice: row.is_beginner_choice,
});

// Потребность («Пилить доски») вместе с вариантами: сначала пишем потребность,
// потом разницу по вариантам (спека 004).
export function ToolForm({
  projectId,
  tool,
  onSaved,
}: {
  projectId: string;
  tool: ToolWithVariants | null;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [stageCodesText, setStageCodesText] = useState((tool?.stage_codes ?? []).join(', '));
  const [variants, setVariants] = useState<VariantDraft[]>(
    (tool?.tool_variants ?? []).map(toDraft)
  );

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: tool
      ? {
          name: tool.name,
          category: tool.category,
          reason: tool.reason,
          days_needed: tool.days_needed,
          sort: tool.sort,
        }
      : { name: '', category: 'power', reason: '', days_needed: 1, sort: 0 },
  });
  const { errors, isSubmitting } = form.formState;
  const category = useWatch({ control: form.control, name: 'category' });

  function checkVariants(): string | null {
    if (variants.length === 0) return t.errNoVariants;
    if (variants.some((v) => v.name.trim() === '')) return t.errVariantName;
    if (variants.some((v) => v.priceText.trim() === '' && v.rentDayText.trim() === ''))
      return t.errVariantPrice;
    if (variants.filter((v) => v.isBeginnerChoice).length !== 1) return t.errBeginner;
    return null;
  }

  async function onSubmit(values: ToolFormValues) {
    setServerError(null);
    const problem = checkVariants();
    setVariantError(problem);
    if (problem) return;
    const payload = {
      ...values,
      stage_codes: stageCodesText
        .split(',')
        .map((code) => code.trim())
        .filter(Boolean),
    };
    try {
      let toolId = tool?.id ?? '';
      if (tool) {
        await apiFetch(`/api/admin/tools/${tool.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiFetch<{ data: { id: string } }>('/api/admin/tools', {
          method: 'POST',
          body: JSON.stringify({ ...payload, project_id: projectId }),
        });
        toolId = created.data.id;
      }
      await saveVariants(toolId, tool?.tool_variants ?? [], variants);
      onSaved();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : ru.common.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {(serverError ?? variantError) && (
        <Alert variant="destructive">
          <AlertDescription>{serverError ?? variantError}</AlertDescription>
        </Alert>
      )}

      <FormField label={t.name} htmlFor="tl-name" error={errors.name?.message}>
        <Input id="tl-name" {...form.register('name')} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t.category} error={errors.category?.message}>
          <Select
            value={category}
            onValueChange={(v) => form.setValue('category', v as ToolFormValues['category'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ru.tools.categories).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t.daysNeeded} htmlFor="tl-days" error={errors.days_needed?.message}>
          <Input
            id="tl-days"
            type="number"
            {...form.register('days_needed', { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField label={t.reason} htmlFor="tl-reason" error={errors.reason?.message}>
        <Textarea id="tl-reason" rows={2} {...form.register('reason')} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t.stageCodes} htmlFor="tl-stages">
          <Input
            id="tl-stages"
            value={stageCodesText}
            onChange={(e) => setStageCodesText(e.target.value)}
          />
        </FormField>
        <FormField label={t.sort} htmlFor="tl-sort" error={errors.sort?.message}>
          <Input id="tl-sort" type="number" {...form.register('sort', { valueAsNumber: true })} />
        </FormField>
      </div>

      <ToolVariantsField value={variants} onChange={setVariants} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
