import { ru } from '@/lib/i18n/ru';
import type { Soil } from '@/lib/foundation/freezing';

// Подбор правила фундамента (SPEC 5.3): точное совпадение
// (soil, high_water, relief, weight_class); нет совпадения → консервативно 'piles'.
export type Foundation = 'piles' | 'mzlf' | 'columnar';
export type HighWater = 'yes' | 'no' | 'unknown';
export type Relief = 'flat' | 'slope';
export type WeightClass = 'light' | 'standard';

export type FoundationRuleRow = {
  soil: Soil;
  high_water: HighWater;
  relief: Relief;
  weight_class: WeightClass;
  foundation: Foundation;
  reason_points: string[];
};

// light: hozblok/banya/garage ≤ 35 м², standard: дома (SPEC 3.5).
export function computeWeightClass(buildingType: string, areaM2: number): WeightClass {
  return ['hozblok', 'banya', 'garage'].includes(buildingType) && areaM2 <= 35
    ? 'light'
    : 'standard';
}

export function pickFoundationRule(
  rules: FoundationRuleRow[],
  input: { soil: Soil; highWater: HighWater; relief: Relief; weightClass: WeightClass }
): { foundation: Foundation; reasonPoints: string[] } {
  const match = rules.find(
    (r) =>
      r.soil === input.soil &&
      r.high_water === input.highWater &&
      r.relief === input.relief &&
      r.weight_class === input.weightClass
  );
  if (match) {
    return { foundation: match.foundation, reasonPoints: match.reason_points };
  }
  return { foundation: 'piles', reasonPoints: [ru.foundation.fallbackReason] };
}
