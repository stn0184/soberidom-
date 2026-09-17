'use client';

import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/admin/form-field';
import type { ToolVariantInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.tools;

// Черновик варианта: цены живут строками, потому что «пусто» — это null
// (вариант только под аренду или только под покупку), а не ноль.
export type VariantDraft = {
  id: string | null; // null — вариант ещё не в базе
  name: string;
  description: string;
  recommendation: ToolVariantInput['recommendation'];
  priceText: string;
  rentDayText: string;
  speedNote: string;
  isBeginnerChoice: boolean;
};

export const emptyVariant = (): VariantDraft => ({
  id: null,
  name: '',
  description: '',
  recommendation: 'buy',
  priceText: '',
  rentDayText: '',
  speedNote: '',
  isBeginnerChoice: false,
});

// Варианты одной потребности. Ровно один «советуем новичку» — правило формы:
// API сохраняет варианты по одному и этого не видит (спека 004).
export function ToolVariantsField({
  value,
  onChange,
}: {
  value: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
}) {
  const patch = (index: number, fields: Partial<VariantDraft>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...fields } : v)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{t.variantsTitle}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyVariant()])}>
          <Plus />
          {t.addVariant}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t.variantsHint}</p>

      {value.map((variant, index) => (
        <div key={variant.id ?? `new-${index}`} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-start gap-2">
            <div className="grow">
              <FormField label={t.variantName}>
                <Input
                  value={variant.name}
                  onChange={(e) => patch(index, { name: e.target.value })}
                />
              </FormField>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-7"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 />
              <span className="sr-only">{t.removeVariant}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.variantRecommendation}>
              <Select
                value={variant.recommendation}
                onValueChange={(v) =>
                  patch(index, { recommendation: v as VariantDraft['recommendation'] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ru.tools.recommendation).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t.variantSpeedNote}>
              <Input
                value={variant.speedNote}
                onChange={(e) => patch(index, { speedNote: e.target.value })}
              />
            </FormField>
            <FormField label={t.variantPrice}>
              <Input
                type="number"
                value={variant.priceText}
                onChange={(e) => patch(index, { priceText: e.target.value })}
              />
            </FormField>
            <FormField label={t.variantRentDay}>
              <Input
                type="number"
                value={variant.rentDayText}
                onChange={(e) => patch(index, { rentDayText: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label={t.variantDescription}>
            <Textarea
              rows={2}
              value={variant.description}
              onChange={(e) => patch(index, { description: e.target.value })}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={variant.isBeginnerChoice}
              onCheckedChange={(checked) =>
                onChange(
                  value.map((v, i) => ({ ...v, isBeginnerChoice: i === index && checked === true }))
                )
              }
            />
            {t.variantBeginner}
          </label>
        </div>
      ))}
    </div>
  );
}
