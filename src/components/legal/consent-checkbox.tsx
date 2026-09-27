'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { ru } from '@/lib/i18n/ru';

const t = ru.legal.consent;

// Общий чекбокс согласия (спека 006): дисклеймер + оферта, ссылки открываются в новой
// вкладке. Один и тот же текст при покупке и при открытии бесплатного проекта —
// то, с чем согласился человек, фиксируется в purchases.config.consent с версией и датой.
export function ConsentCheckbox({
  checked,
  onCheckedChange,
  id = 'legal-consent',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="leading-snug">
        {t.prefix}
        <Link
          href="/legal/disclaimer"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t.disclaimerLink}
        </Link>
        {t.middle}
        <Link href="/legal/offer" target="_blank" rel="noopener noreferrer" className="underline">
          {t.offerLink}
        </Link>
      </label>
    </div>
  );
}
