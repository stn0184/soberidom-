'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ru } from '@/lib/i18n/ru';

// Живой статус линтера контента шага (SPEC 5.10) — сохранять черновик можно,
// публикация проекта с такими шагами блокируется на сервере.
export function StepLintPanel({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return (
      <Alert>
        <CircleCheck />
        <AlertTitle>{ru.admin.steps.lintOk}</AlertTitle>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{ru.admin.steps.lintFail}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
