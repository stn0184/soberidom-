'use client';

import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.projects;

type LayoutNotesFieldProps = {
  control: Control<ProjectInput>;
  register: UseFormRegister<ProjectInput>;
};

// layout_notes: [{title, text}] — блок «Почему планировка удачна» (SPEC 2.4).
export function LayoutNotesField({ control, register }: LayoutNotesFieldProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'layout_notes' });

  return (
    <div className="space-y-2">
      <Label>{t.layoutNotes}</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2">
            <Input
              placeholder={t.layoutNoteTitle}
              {...register(`layout_notes.${index}.title`)}
            />
            <Input
              placeholder={t.layoutNoteText}
              {...register(`layout_notes.${index}.text`)}
            />
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: '', text: '' })}
      >
        <Plus />
        {t.addNote}
      </Button>
    </div>
  );
}
