import type { Database } from '@/types/database';
import type { PartInput, ProjectInput } from '@/lib/zod/admin';

// Типы строк — из сгенерированных Supabase-типов (src/types/database.ts).
// Поля jsonb и check-констрейнтов генератор типизирует как Json/string,
// поэтому они сужаются поверх до реальных форм из SPEC Блок 2 (union'ы — из Zod-схем).
type Tables = Database['public']['Tables'];

export type AppliesWhen = Record<string, string>;
export type LayoutNote = { title: string; text: string };

export type ProjectRow = Omit<
  Tables['house_projects']['Row'],
  'building_type' | 'style' | 'status' | 'heating_options' | 'layout_notes'
> & {
  building_type: ProjectInput['building_type'];
  style: ProjectInput['style'];
  status: ProjectInput['status'];
  heating_options: ProjectInput['heating_options'];
  layout_notes: LayoutNote[];
};

export type StageRow = Omit<Tables['stages']['Row'], 'applies_when' | 'color'> & {
  applies_when: AppliesWhen;
  color: PartInput['color'] | null; // v1.5: цветовая маркировка этапа
};

export type StepRow = Omit<
  Tables['steps']['Row'],
  'actions' | 'self_check' | 'applies_when'
> & {
  actions: string[];
  self_check: string[];
  applies_when: AppliesWhen;
};

export type PartRow = Omit<Tables['parts']['Row'], 'color' | 'applies_when'> & {
  color: PartInput['color'];
  applies_when: AppliesWhen;
};

export type ConfigOptionRow = Omit<Tables['config_options']['Row'], 'group_key'> & {
  group_key: 'lumber' | 'roofing' | 'finish_ext' | 'finish_int' | 'foundation';
};

export type MaterialRow = Tables['materials']['Row'];
export type MaterialPriceRow = Tables['material_prices']['Row'];
export type RegionRow = Tables['regions']['Row'];
