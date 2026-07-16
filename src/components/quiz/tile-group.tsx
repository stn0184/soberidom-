'use client';

import { cn } from '@/lib/utils';

export type TileOption = { key: string; label: string; hint?: string };

// Крупные плитки-варианты анкеты: один вопрос на экран (US-001).
export function TileGroup({
  options,
  value,
  onChange,
}: {
  options: TileOption[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            'rounded-xl border p-4 text-left transition-colors hover:bg-accent',
            value === option.key && 'border-primary ring-2 ring-primary/30'
          )}
        >
          <span className="font-medium">{option.label}</span>
          {option.hint && (
            <span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span>
          )}
        </button>
      ))}
    </div>
  );
}
