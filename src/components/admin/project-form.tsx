'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/admin/form-field';
import { LayoutNotesField } from '@/components/admin/layout-notes-field';
import { ProjectFormFields } from '@/components/admin/project-form-fields';
import { ProjectFormMedia } from '@/components/admin/project-form-media';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import type { ProjectRow } from '@/lib/admin/types';
import { projectSchema, type ProjectInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.projects;
const HEATING = ['gas', 'electric', 'solid_fuel'] as const;

function toDefaults(project: ProjectRow | null): ProjectInput {
  if (project) {
    return {
      ...project,
      floors: project.floors as 1 | 2,
      currency: project.currency as ProjectInput['currency'],
      layout_notes: project.layout_notes ?? [],
    };
  }
  return {
    slug: '',
    title: '',
    building_type: 'house',
    style: 'classic',
    floors: 1,
    area_m2: 0,
    rooms: 1,
    footprint: '',
    heating_options: ['electric', 'solid_fuel'],
    max_snow_region: 5,
    layout_notes: [],
    description: '',
    price_minor: 0,
    currency: 'RUB',
    cover_image_url: '',
    gallery_urls: [],
    model_glb_url: '',
    isometric_fallback_url: '',
    status: 'draft',
    sp_compliant: true,
  };
}

export function ProjectForm({
  project,
  onSaved,
}: {
  project: ProjectRow | null;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: toDefaults(project),
  });
  const { errors, isSubmitting } = form.formState;
  const heating = useWatch({ control: form.control, name: 'heating_options' });
  const spCompliant = useWatch({ control: form.control, name: 'sp_compliant' });

  async function onSubmit(values: ProjectInput) {
    setServerError(null);
    try {
      if (project) {
        await apiFetch(`/api/admin/projects/${project.id}`, {
          method: 'PATCH',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch('/api/admin/projects', {
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

      <ProjectFormFields form={form} />

      <div className="space-y-1.5">
        <Label>{t.heatingOptions}</Label>
        <div className="flex flex-wrap gap-4">
          {HEATING.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={heating.includes(key)}
                onCheckedChange={(checked) =>
                  form.setValue(
                    'heating_options',
                    checked === true ? [...heating, key] : heating.filter((h) => h !== key)
                  )
                }
              />
              {t.heating[key]}
            </label>
          ))}
        </div>
      </div>

      <FormField label={t.description} htmlFor="p-desc" error={errors.description?.message}>
        <Textarea id="p-desc" rows={4} {...form.register('description')} />
      </FormField>

      <LayoutNotesField control={form.control} register={form.register} />
      <ProjectFormMedia form={form} />

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={spCompliant}
          onCheckedChange={(v) => form.setValue('sp_compliant', v)}
        />
        {t.spCompliant}
      </label>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
