'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConsentCheckbox } from '@/components/legal/consent-checkbox';
import { ProjectAttribution } from '@/components/legal/project-attribution';
import type { PlanAttribution } from '@/lib/legal/helpers';
import { ru } from '@/lib/i18n/ru';

const t = ru.legal.freeDialog;

export type FreeAccessProject = PlanAttribution & { id: string; title: string };

// Диалог перед открытием бесплатного проекта (спека 006): короткий текст, автор и
// лицензия планов из данных проекта (не из кода), чекбокс согласия; «Открыть»
// неактивна без галочки. Показывается один раз: после согласия у проекта появляется
// покупка, и он уходит из meta.freeProjects.
export function FreeAccessDialog({
  project,
  busy,
  onOpenChange,
  onConfirm,
}: {
  project: FreeAccessProject | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectId: string) => void;
}) {
  const [consent, setConsent] = useState(false);

  function handleOpenChange(open: boolean) {
    if (!open) setConsent(false);
    onOpenChange(open);
  }

  return (
    <Dialog open={project !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project?.title ?? t.title}</DialogTitle>
          <DialogDescription>{t.text}</DialogDescription>
        </DialogHeader>
        {project && <ProjectAttribution attribution={project} />}
        <ConsentCheckbox id="free-access-consent" checked={consent} onCheckedChange={setConsent} />
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            disabled={!consent || busy || project === null}
            onClick={() => project && onConfirm(project.id)}
          >
            {busy && <Loader2 className="animate-spin" />}
            {busy ? ru.my.freeOpening : t.open}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
