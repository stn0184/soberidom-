'use client';

import Image from 'next/image';
import { Check, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

// Карточка варианта вместо радио-кнопки с термином (UX_PRINCIPLES п.2–3):
// картинка + простое название + объяснение + цена + «Совет новичку».
// Контент — из базы (config_options); пустые поля аккуратно пропускаются.
export type ConfigOptionCard = {
  key: string;
  label: string;
  isDefault: boolean;
  imageUrl: string;
  humanDescription: string;
  priceHint: string;
  isBeginnerChoice: boolean;
  beginnerAdvice: string;
};

export function OptionCards({
  options,
  value,
  onChange,
}: {
  options: ConfigOptionCard[];
  value: string | undefined;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              'flex flex-col overflow-hidden rounded-xl border text-left transition-colors hover:bg-accent/50',
              selected && 'border-primary ring-2 ring-primary/30'
            )}
          >
            <div className="relative aspect-video w-full bg-muted">
              {option.imageUrl ? (
                <Image
                  src={option.imageUrl}
                  alt={option.label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-8" />
                </div>
              )}
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                  <Check className="size-4" />
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">{option.label}</span>
                {option.priceHint && (
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">
                    {option.priceHint}
                  </span>
                )}
              </div>
              {option.humanDescription && (
                <p className="text-sm text-muted-foreground">{option.humanDescription}</p>
              )}
              {option.isBeginnerChoice && (
                <div className="mt-auto rounded-lg bg-primary/10 p-2 text-sm">
                  <span className="font-medium">{ru.project.beginnerBadge}</span>
                  {option.beginnerAdvice && <>: {option.beginnerAdvice}</>}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
