'use client';

import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/admin/form-field';
import type { ProjectInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.projects;

// Базовые скалярные поля проекта (SPEC 2.4) + блок «Источник планов» (спека 006).
export function ProjectFormFields({ form }: { form: UseFormReturn<ProjectInput> }) {
  const { errors } = form.formState;
  const buildingType = useWatch({ control: form.control, name: 'building_type' });
  const style = useWatch({ control: form.control, name: 'style' });
  const floors = useWatch({ control: form.control, name: 'floors' });
  const currency = useWatch({ control: form.control, name: 'currency' });
  const status = useWatch({ control: form.control, name: 'status' });

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label={t.projectTitle} htmlFor="p-title" error={errors.title?.message}>
        <Input id="p-title" {...form.register('title')} />
      </FormField>
      <FormField label={t.slug} htmlFor="p-slug" error={errors.slug?.message}>
        <Input id="p-slug" {...form.register('slug')} />
      </FormField>
      <FormField label={t.buildingType} error={errors.building_type?.message}>
        <Select
          value={buildingType}
          onValueChange={(v) =>
            form.setValue('building_type', v as ProjectInput['building_type'])
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.buildingTypes).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t.style} error={errors.style?.message}>
        <Select
          value={style}
          onValueChange={(v) => form.setValue('style', v as ProjectInput['style'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.styles).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t.floors} error={errors.floors?.message}>
        <Select
          value={String(floors)}
          onValueChange={(v) => form.setValue('floors', Number(v) as 1 | 2)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t.rooms} htmlFor="p-rooms" error={errors.rooms?.message}>
        <Input id="p-rooms" type="number" {...form.register('rooms', { valueAsNumber: true })} />
      </FormField>
      <FormField label={t.areaM2} htmlFor="p-area" error={errors.area_m2?.message}>
        <Input
          id="p-area"
          type="number"
          step="0.1"
          {...form.register('area_m2', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label={t.footprint} htmlFor="p-footprint" error={errors.footprint?.message}>
        <Input id="p-footprint" {...form.register('footprint')} />
      </FormField>
      <FormField label={t.maxSnowRegion} htmlFor="p-snow" error={errors.max_snow_region?.message}>
        <Input
          id="p-snow"
          type="number"
          {...form.register('max_snow_region', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label={t.priceMinor} htmlFor="p-price" error={errors.price_minor?.message}>
        <Input
          id="p-price"
          type="number"
          {...form.register('price_minor', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label={t.currency} error={errors.currency?.message}>
        <Select
          value={currency}
          onValueChange={(v) => form.setValue('currency', v as ProjectInput['currency'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RUB">RUB</SelectItem>
            <SelectItem value="KZT">KZT</SelectItem>
            <SelectItem value="BYN">BYN</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t.status} error={errors.status?.message}>
        <Select
          value={status}
          onValueChange={(v) => form.setValue('status', v as ProjectInput['status'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.statuses).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <p className="col-span-2 pt-2 text-sm font-medium">{t.planSourceTitle}</p>
      <FormField label={t.planAuthor} htmlFor="p-plan-author" error={errors.plan_author?.message}>
        <Input id="p-plan-author" {...form.register('plan_author')} />
      </FormField>
      <FormField label={t.planSourceUrl} htmlFor="p-plan-src" error={errors.plan_source_url?.message}>
        <Input id="p-plan-src" type="url" {...form.register('plan_source_url')} />
      </FormField>
      <FormField label={t.planLicense} htmlFor="p-plan-lic" error={errors.plan_license?.message}>
        <Input id="p-plan-lic" {...form.register('plan_license')} />
      </FormField>
      <FormField label={t.planLicenseUrl} htmlFor="p-plan-lic-url" error={errors.plan_license_url?.message}>
        <Input id="p-plan-lic-url" type="url" {...form.register('plan_license_url')} />
      </FormField>
    </div>
  );
}
