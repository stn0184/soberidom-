'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CircleCheck,
  Clock,
  CloudRain,
  Lightbulb,
  ShieldAlert,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StepTake } from '@/components/build/step-take';
import type { BuildStage, BuildStep } from '@/components/build/build-types';
import { ru } from '@/lib/i18n/ru';

const t = ru.build;

// Анатомия шага (US-007, SPEC 4.7): зачем → подготовьте → возьмите → сделайте →
// безопасность → подсказка → частая ошибка → «проверьте себя» → готово.
export function StepView({
  stage,
  step,
  index,
  total,
  onDone,
  onReopen,
  onBack,
}: {
  stage: BuildStage;
  step: BuildStep;
  index: number;
  total: number;
  onDone: () => void;
  onReopen: () => void;
  onBack: (() => void) | null;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => step.selfCheck.map(() => false));
  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {t.breadcrumb(stage.number, stage.displayName)} · {t.stepOf(index + 1, total)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{step.title}</h1>
          {step.isPractice && <Badge variant="secondary">{t.practice}</Badge>}
          {step.isMandatory && <Badge>{t.mandatory}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {(step.durationMinSolo !== null || step.durationMinPair !== null) && (
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {t.duration(step.durationMinSolo, step.durationMinPair)}
            </span>
          )}
          <span title={`${step.difficulty}/3`}>{t.difficulty(step.difficulty)}</span>
          {step.helpersNeeded > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {t.helpers(step.helpersNeeded)}
            </span>
          )}
          {step.weatherNote && (
            <span className="flex items-center gap-1">
              <CloudRain className="size-4" />
              {step.weatherNote}
            </span>
          )}
        </div>
      </div>

      {step.why && <p className="italic text-muted-foreground">{step.why}</p>}

      {step.prep && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>{t.prep}</AlertTitle>
          <AlertDescription>{step.prep}</AlertDescription>
        </Alert>
      )}

      {step.imageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
          <Image src={step.imageUrl} alt={step.title} fill className="object-contain" unoptimized />
        </div>
      )}

      <StepTake step={step} />

      {step.actions.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">{t.doTitle}</h2>
          <ol className="list-decimal space-y-1.5 pl-5">
            {step.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
      )}

      {step.safety && (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>{t.safety}</AlertTitle>
          <AlertDescription>{step.safety}</AlertDescription>
        </Alert>
      )}
      {step.hint && (
        <Alert>
          <Lightbulb />
          <AlertTitle>{t.hint}</AlertTitle>
          <AlertDescription>{step.hint}</AlertDescription>
        </Alert>
      )}
      {step.commonMistake && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>{t.commonMistake}</AlertTitle>
          <AlertDescription>{step.commonMistake}</AlertDescription>
        </Alert>
      )}

      {step.done ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>{t.doneStep}</AlertTitle>
        </Alert>
      ) : (
        step.selfCheck.length > 0 && (
          <div className="space-y-2 rounded-xl border p-4">
            <h2 className="font-semibold">{t.selfCheck}</h2>
            <p className="text-sm text-muted-foreground">{t.selfCheckHint}</p>
            <ul className="space-y-2 pt-1">
              {step.selfCheck.map((item, i) => (
                <li key={item}>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={checked[i] ?? false}
                      onCheckedChange={(c) =>
                        setChecked((prev) => prev.map((v, j) => (j === i ? c === true : v)))
                      }
                    />
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            {t.backBtn}
          </Button>
        )}
        <div className="flex-1" />
        {step.done ? (
          <Button variant="outline" onClick={onReopen}>
            {t.reopen}
          </Button>
        ) : (
          <>
            {step.isPractice && !step.isMandatory && (
              <Button variant="ghost" onClick={onDone}>
                {t.practiceSkip}
              </Button>
            )}
            <Button size="lg" disabled={!allChecked && step.selfCheck.length > 0} onClick={onDone}>
              {t.doneBtn}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
