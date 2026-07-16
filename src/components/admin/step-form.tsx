'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StepFormFields, type StepFormValues } from '@/components/admin/step-form-fields';
import { StepLintPanel } from '@/components/admin/step-lint-panel';
import { ApiError, apiFetch } from '@/lib/admin/fetcher';
import { parseAppliesWhen, splitLines } from '@/lib/admin/form-utils';
import { lintStep } from '@/lib/admin/linter';
import type { StepRow } from '@/lib/admin/types';
import { stepSchema } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const formSchema = stepSchema.omit({ stage_id: true });

// Анатомия шага (SPEC US-007): массивы редактируются «пункт с новой строки»,
// поэтому payload собирается вручную и валидируется Zod-схемой при сохранении.
// Черновик с ошибками линтера сохранять можно — публикацию блокирует сервер (5.10).
export function StepForm({
  stageId,
  step,
  nextSort,
  onSaved,
}: {
  stageId: string;
  step: StepRow | null;
  nextSort: number;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState<StepFormValues>({
    sort: String(step?.sort ?? nextSort),
    title: step?.title ?? '',
    why_text: step?.why_text ?? '',
    prep_text: step?.prep_text ?? '',
    image_url: step?.image_url ?? '',
    actionsText: (step?.actions ?? []).join('\n'),
    toolsText: (step?.tools ?? []).join('\n'),
    safety_text: step?.safety_text ?? '',
    durationSolo: step?.duration_min_solo != null ? String(step.duration_min_solo) : '',
    durationPair: step?.duration_min_pair != null ? String(step.duration_min_pair) : '',
    difficulty: String(step?.difficulty ?? 1),
    weather_note: step?.weather_note ?? '',
    selfCheckText: (step?.self_check ?? []).join('\n'),
    hint: step?.hint ?? '',
    common_mistake: step?.common_mistake ?? '',
    helpers: String(step?.helpers_needed ?? 0),
    is_practice: step?.is_practice ?? false,
    is_mandatory: step?.is_mandatory ?? false,
    appliesWhenText: JSON.stringify(step?.applies_when ?? {}),
  });

  function set<K extends keyof StepFormValues>(key: K, value: StepFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  const lintIssues = useMemo(
    () =>
      lintStep({
        title: v.title,
        why_text: v.why_text,
        prep_text: v.prep_text,
        actions: splitLines(v.actionsText),
        self_check: splitLines(v.selfCheckText),
        duration_min_solo: v.durationSolo ? Number(v.durationSolo) : null,
        safety_text: v.safety_text,
        weather_note: v.weather_note,
        hint: v.hint,
        common_mistake: v.common_mistake,
      }),
    [v]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    const appliesWhen = parseAppliesWhen(v.appliesWhenText);
    if (appliesWhen === null) {
      setServerError(`${ru.admin.common.appliesWhen}: ${ru.admin.common.invalidJson}`);
      return;
    }
    const payload = {
      sort: Number(v.sort),
      title: v.title.trim(),
      why_text: v.why_text,
      prep_text: v.prep_text,
      image_url: v.image_url,
      actions: splitLines(v.actionsText),
      tools: splitLines(v.toolsText),
      safety_text: v.safety_text,
      duration_min_solo: v.durationSolo ? Number(v.durationSolo) : null,
      duration_min_pair: v.durationPair ? Number(v.durationPair) : null,
      difficulty: Number(v.difficulty),
      weather_note: v.weather_note,
      self_check: splitLines(v.selfCheckText),
      hint: v.hint,
      common_mistake: v.common_mistake,
      helpers_needed: Number(v.helpers),
      is_practice: v.is_practice,
      is_mandatory: v.is_mandatory,
      applies_when: appliesWhen,
    };
    const parsed = formSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setServerError(`${first?.path.join('.')}: ${first?.message}`);
      return;
    }
    setBusy(true);
    try {
      if (step) {
        await apiFetch(`/api/admin/steps/${step.id}`, {
          method: 'PATCH',
          body: JSON.stringify(parsed.data),
        });
      } else {
        await apiFetch('/api/admin/steps', {
          method: 'POST',
          body: JSON.stringify({ ...parsed.data, stage_id: stageId }),
        });
      }
      onSaved();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : ru.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <StepLintPanel issues={lintIssues} />
      <StepFormFields v={v} set={set} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        {busy ? ru.common.pleaseWait : ru.admin.common.save}
      </Button>
    </form>
  );
}
