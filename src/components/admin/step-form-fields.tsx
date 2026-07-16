'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/admin/file-upload';
import { FormField } from '@/components/admin/form-field';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.steps;

export type StepFormValues = {
  sort: string;
  title: string;
  why_text: string;
  prep_text: string;
  image_url: string;
  actionsText: string;
  toolsText: string;
  safety_text: string;
  durationSolo: string;
  durationPair: string;
  difficulty: string;
  weather_note: string;
  selfCheckText: string;
  hint: string;
  common_mistake: string;
  helpers: string;
  is_practice: boolean;
  is_mandatory: boolean;
  appliesWhenText: string;
};

type SetField = <K extends keyof StepFormValues>(key: K, value: StepFormValues[K]) => void;

// Поля анатомии шага (SPEC US-007). Массивы — «пункт с новой строки».
export function StepFormFields({ v, set }: { v: StepFormValues; set: SetField }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t.sort} htmlFor="st-sort">
          <Input id="st-sort" type="number" value={v.sort} onChange={(e) => set('sort', e.target.value)} />
        </FormField>
        <FormField label={t.difficulty} htmlFor="st-diff">
          <Input id="st-diff" type="number" min={1} max={3} value={v.difficulty} onChange={(e) => set('difficulty', e.target.value)} />
        </FormField>
        <FormField label={t.durationSolo} htmlFor="st-dsolo">
          <Input id="st-dsolo" type="number" value={v.durationSolo} onChange={(e) => set('durationSolo', e.target.value)} />
        </FormField>
        <FormField label={t.durationPair} htmlFor="st-dpair">
          <Input id="st-dpair" type="number" value={v.durationPair} onChange={(e) => set('durationPair', e.target.value)} />
        </FormField>
        <FormField label={t.helpersNeeded} htmlFor="st-helpers">
          <Input id="st-helpers" type="number" min={0} value={v.helpers} onChange={(e) => set('helpers', e.target.value)} />
        </FormField>
      </div>

      <FormField label={t.stepTitle} htmlFor="st-title">
        <Input id="st-title" value={v.title} onChange={(e) => set('title', e.target.value)} />
      </FormField>
      <FormField label={t.whyText} htmlFor="st-why">
        <Textarea id="st-why" rows={2} value={v.why_text} onChange={(e) => set('why_text', e.target.value)} />
      </FormField>
      <FormField label={t.prepText} htmlFor="st-prep">
        <Textarea id="st-prep" rows={2} value={v.prep_text} onChange={(e) => set('prep_text', e.target.value)} />
      </FormField>
      <div className="space-y-1.5">
        <Label>{t.imageUrl}</Label>
        <FileUpload
          bucket="public-assets"
          accept="image/webp,image/png,image/jpeg"
          value={v.image_url}
          onChange={(url) => set('image_url', url)}
        />
      </div>
      <FormField label={t.actions} htmlFor="st-actions" hint={ru.admin.common.perLine}>
        <Textarea id="st-actions" rows={5} value={v.actionsText} onChange={(e) => set('actionsText', e.target.value)} />
      </FormField>
      <FormField label={t.tools} htmlFor="st-tools" hint={ru.admin.common.perLine}>
        <Textarea id="st-tools" rows={3} value={v.toolsText} onChange={(e) => set('toolsText', e.target.value)} />
      </FormField>
      <FormField label={t.selfCheck} htmlFor="st-check" hint={ru.admin.common.perLine}>
        <Textarea id="st-check" rows={3} value={v.selfCheckText} onChange={(e) => set('selfCheckText', e.target.value)} />
      </FormField>
      <FormField label={t.safetyText} htmlFor="st-safety">
        <Textarea id="st-safety" rows={2} value={v.safety_text} onChange={(e) => set('safety_text', e.target.value)} />
      </FormField>
      <FormField label={t.weatherNote} htmlFor="st-weather">
        <Input id="st-weather" value={v.weather_note} onChange={(e) => set('weather_note', e.target.value)} />
      </FormField>
      <FormField label={t.hint} htmlFor="st-hint">
        <Input id="st-hint" value={v.hint} onChange={(e) => set('hint', e.target.value)} />
      </FormField>
      <FormField label={t.commonMistake} htmlFor="st-mistake">
        <Input id="st-mistake" value={v.common_mistake} onChange={(e) => set('common_mistake', e.target.value)} />
      </FormField>
      <FormField label={ru.admin.common.appliesWhen} htmlFor="st-aw" hint={ru.admin.common.appliesWhenHint}>
        <Textarea id="st-aw" rows={2} value={v.appliesWhenText} onChange={(e) => set('appliesWhenText', e.target.value)} />
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={v.is_practice} onCheckedChange={(val) => set('is_practice', val)} />
        {t.isPractice}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={v.is_mandatory} onCheckedChange={(val) => set('is_mandatory', val)} />
        {t.isMandatory}
      </label>
    </>
  );
}
