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
import type { RegionRow } from '@/lib/admin/types';
import { COUNTRY_CODES } from '@/lib/constants';
import { regionSchema, type RegionInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.regions;

export function RegionForm({
  region,
  onSaved,
}: {
  region: RegionRow | null;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RegionInput>({
    resolver: zodResolver(regionSchema),
    defaultValues: region
      ? {
          country_code: region.country_code.trim() as RegionInput['country_code'],
          name: region.name,
          mt: region.mt,
          snow_region: region.snow_region,
          wind_region: region.wind_region,
        }
      : { country_code: 'RU', name: '', mt: 0, snow_region: 1, wind_region: 1 },
  });
  const { errors, isSubmitting } = form.formState;
  const countryCode = useWatch({ control: form.control, name: 'country_code' });

  async function onSubmit(values: RegionInput) {
    setServerError(null);
    try {
      if (region) {
        await apiFetch(`/api/admin/regions/${region.id}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch('/api/admin/regions', {
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

      <FormField label={t.country} error={errors.country_code?.message}>
        <Select
          value={countryCode}
          onValueChange={(v) =>
            form.setValue('country_code', v as RegionInput['country_code'])
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                {ru.countries[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={t.name} htmlFor="r-name" error={errors.name?.message}>
        <Input id="r-name" {...form.register('name')} />
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField label={t.mt} htmlFor="r-mt" error={errors.mt?.message}>
          <Input id="r-mt" type="number" step="0.1" {...form.register('mt', { valueAsNumber: true })} />
        </FormField>
        <FormField label={t.snowRegion} htmlFor="r-snow" error={errors.snow_region?.message}>
          <Input
            id="r-snow"
            type="number"
            min={1}
            max={8}
            {...form.register('snow_region', { valueAsNumber: true })}
          />
        </FormField>
        <FormField label={t.windRegion} htmlFor="r-wind" error={errors.wind_region?.message}>
          <Input
            id="r-wind"
            type="number"
            min={1}
            max={7}
            {...form.register('wind_region', { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
