'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { FormField } from '@/components/admin/form-field';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { MaterialRow } from '@/lib/admin/types';
import { materialSchema, type MaterialInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.materials;
const NO_MOISTURE = 'none';

export function MaterialForm({
  material,
  onSaved,
}: {
  material: MaterialRow | null;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          sku_internal: material.sku_internal,
          name: material.name,
          category: material.category as MaterialInput['category'],
          unit: material.unit as MaterialInput['unit'],
          volume_m3: material.volume_m3,
          weight_kg: material.weight_kg,
          lumber_moisture: material.lumber_moisture as MaterialInput['lumber_moisture'],
        }
      : {
          sku_internal: '',
          name: '',
          category: 'lumber',
          unit: 'pcs',
          volume_m3: 0,
          weight_kg: 0,
          lumber_moisture: null,
        },
  });
  const { errors, isSubmitting } = form.formState;
  const category = useWatch({ control: form.control, name: 'category' });
  const unit = useWatch({ control: form.control, name: 'unit' });
  const moisture = useWatch({ control: form.control, name: 'lumber_moisture' });

  async function onSubmit(values: MaterialInput) {
    setServerError(null);
    try {
      if (material) {
        await apiFetch(`/api/admin/materials/${material.id}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch('/api/admin/materials', {
          method: 'POST',
          body: JSON.stringify(values),
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

      <FormField label={t.name} htmlFor="m-name" error={errors.name?.message}>
        <Input id="m-name" {...form.register('name')} />
      </FormField>
      <FormField label={t.skuInternal} htmlFor="m-sku" error={errors.sku_internal?.message}>
        <Input id="m-sku" {...form.register('sku_internal')} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t.category} error={errors.category?.message}>
          <Select
            value={category}
            onValueChange={(v) => form.setValue('category', v as MaterialInput['category'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.categories).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t.unit} error={errors.unit?.message}>
          <Select
            value={unit}
            onValueChange={(v) => form.setValue('unit', v as MaterialInput['unit'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.units).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t.volumeM3} htmlFor="m-vol" error={errors.volume_m3?.message}>
          <Input
            id="m-vol"
            type="number"
            step="0.00001"
            {...form.register('volume_m3', { valueAsNumber: true })}
          />
        </FormField>
        <FormField label={t.weightKg} htmlFor="m-weight" error={errors.weight_kg?.message}>
          <Input
            id="m-weight"
            type="number"
            step="0.001"
            {...form.register('weight_kg', { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField label={t.lumberMoisture} error={errors.lumber_moisture?.message}>
        <Select
          value={moisture ?? NO_MOISTURE}
          onValueChange={(v) =>
            form.setValue(
              'lumber_moisture',
              v === NO_MOISTURE ? null : (v as 'natural' | 'dry')
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_MOISTURE}>{t.moistureNone}</SelectItem>
            {Object.entries(t.moisture).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
