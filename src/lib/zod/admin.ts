import { z } from 'zod';

// Схемы зеркалят таблицы SPEC Блок 2 (3.16: «Zod-схемы зеркалят таблицы»).
// Ключи — snake_case, как в БД. Сообщения Zod — по-русски (готовая локаль).
z.config(z.locales.ru());

export const appliesWhenSchema = z.record(z.string(), z.string());

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(1),
  building_type: z.enum(['house', 'banya', 'hozblok', 'garage']),
  style: z.enum(['classic', 'barnhouse', 'scandinavian', 'a_frame', 'chalet', 'mini']),
  floors: z.union([z.literal(1), z.literal(2)]),
  area_m2: z.number().positive(),
  rooms: z.number().int().min(1),
  footprint: z.string().trim().min(1),
  heating_options: z.array(z.enum(['gas', 'electric', 'solid_fuel'])),
  max_snow_region: z.number().int().min(1).max(8),
  layout_notes: z.array(z.object({ title: z.string(), text: z.string() })),
  description: z.string(),
  price_minor: z.number().int().min(0),
  currency: z.enum(['RUB', 'KZT', 'BYN']),
  cover_image_url: z.string(),
  gallery_urls: z.array(z.string()),
  model_glb_url: z.string(),
  isometric_fallback_url: z.string(),
  status: z.enum(['draft', 'published']),
  sp_compliant: z.boolean(),
  is_free: z.boolean(), // v1.5: бесплатный проект-эталон
});
export const projectUpdateSchema = projectSchema.partial();
export type ProjectInput = z.infer<typeof projectSchema>;

export const stageSchema = z.object({
  project_id: z.uuid(),
  sort: z.number().int(),
  code: z.string().trim().min(1),
  title: z.string().trim().min(1),
  display_name: z.string(), // v1.5: человеческое имя для пользователя
  color: z.enum(['red', 'green', 'yellow', 'blue', 'orange', 'purple']).nullable(), // v1.5
  intro: z.string(),
  delivery_wave: z.number().int().min(1).max(5),
  applies_when: appliesWhenSchema,
});
export const stageUpdateSchema = stageSchema.partial();
export type StageInput = z.infer<typeof stageSchema>;

export const stepSchema = z.object({
  stage_id: z.uuid(),
  sort: z.number().int(),
  title: z.string().trim().min(1),
  why_text: z.string(),
  prep_text: z.string(),
  image_url: z.string(),
  actions: z.array(z.string()),
  tools: z.array(z.string()),
  safety_text: z.string(),
  duration_min_solo: z.number().int().positive().nullable(),
  duration_min_pair: z.number().int().positive().nullable(),
  difficulty: z.number().int().min(1).max(3),
  weather_note: z.string(),
  self_check: z.array(z.string()),
  hint: z.string(),
  common_mistake: z.string(),
  helpers_needed: z.number().int().min(0),
  is_practice: z.boolean(),
  is_mandatory: z.boolean(),
  applies_when: appliesWhenSchema,
});
export const stepUpdateSchema = stepSchema.partial();
export type StepInput = z.infer<typeof stepSchema>;

export const partSchema = z.object({
  project_id: z.uuid(),
  part_code: z.string().trim().min(1),
  color: z.enum(['red', 'green', 'yellow', 'blue', 'orange', 'purple']),
  material_id: z.uuid(),
  cut_length_mm: z.number().int().positive(),
  qty: z.number().int().positive(),
  applies_when: appliesWhenSchema,
});
export const partUpdateSchema = partSchema.partial();
export type PartInput = z.infer<typeof partSchema>;

export const materialSchema = z.object({
  sku_internal: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum([
    'lumber',
    'sheet',
    'insulation',
    'roofing',
    'fasteners',
    'membrane',
    'foundation',
    'finish_ext',
    'finish_int',
    'engineering',
    'tools',
    'other',
  ]),
  unit: z.enum(['pcs', 'm', 'm2', 'm3', 'kg', 'pack', 'set']),
  volume_m3: z.number().min(0),
  weight_kg: z.number().min(0),
  lumber_moisture: z.enum(['natural', 'dry']).nullable(),
});
export const materialUpdateSchema = materialSchema.partial();
export type MaterialInput = z.infer<typeof materialSchema>;

export const priceSchema = z.object({
  material_id: z.uuid(),
  country_code: z.enum(['RU', 'KZ', 'BY']),
  region_id: z.uuid().nullable(),
  price_minor: z.number().int().min(0),
  currency: z.enum(['RUB', 'KZT', 'BYN']),
});
export const priceUpdateSchema = priceSchema.partial();
export type PriceInput = z.infer<typeof priceSchema>;

export const regionSchema = z.object({
  country_code: z.enum(['RU', 'KZ', 'BY']),
  name: z.string().trim().min(1),
  mt: z.number().min(0),
  snow_region: z.number().int().min(1).max(8),
  wind_region: z.number().int().min(1).max(7),
});
export const regionUpdateSchema = regionSchema.partial();
export type RegionInput = z.infer<typeof regionSchema>;

export const regionsImportSchema = z.object({
  csv: z.string().min(1),
});
