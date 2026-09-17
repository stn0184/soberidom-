import { z } from 'zod';
import { ru } from '@/lib/i18n/ru';

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
  duration_days: z.number().int().positive().nullable(), // карта путешествия
  result_image_url: z.string(), // «должно получиться вот так»
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

// Инструмент = потребность + варианты (спека 004). project_tools — потребность:
// «Пилить доски», зачем она, сколько дней нужна и на каких этапах. Старые колонки
// плоской модели (recommendation, approx_price_minor, alternative) в схему не входят.
export const toolSchema = z.object({
  project_id: z.uuid(),
  name: z.string().trim().min(1),
  category: z.enum(['measure', 'hand', 'power', 'level', 'safety', 'special']),
  reason: z.string().trim().min(1),
  days_needed: z.number().int().min(1).max(365),
  stage_codes: z.array(z.string().trim().min(1)),
  sort: z.number().int().min(0),
});
export const toolUpdateSchema = toolSchema.partial();
export type ToolInput = z.infer<typeof toolSchema>;

// Вариант инструмента: хотя бы одна цена задана — «только аренда» (нейлер, леса)
// живёт с price_minor = null, «только покупка» — с rent_day_minor = null.
const toolVariantFields = z.object({
  tool_id: z.uuid(),
  name: z.string().trim().min(1),
  description: z.string().trim(),
  recommendation: z.enum(['buy', 'rent', 'borrow_or_buy_cheap']),
  price_minor: z.number().int().min(0).max(100_000_000).nullable(),
  rent_day_minor: z.number().int().min(0).max(100_000_000).nullable(),
  speed_note: z.string().trim(),
  is_beginner_choice: z.boolean(),
  sort: z.number().int().min(0),
});
const bothPricesEmpty = (v: { price_minor?: number | null; rent_day_minor?: number | null }) =>
  v.price_minor === null && v.rent_day_minor === null;
export const toolVariantSchema = toolVariantFields.refine(
  (v) => !bothPricesEmpty(v),
  ru.admin.tools.errVariantPrice,
);
export const toolVariantUpdateSchema = toolVariantFields
  .partial()
  .refine((v) => !bothPricesEmpty(v), ru.admin.tools.errVariantPrice);
export type ToolVariantInput = z.infer<typeof toolVariantFields>;

// Опции конфигуратора + поля «человеческого» показа (UX_PRINCIPLES, миграция 010).
export const configOptionSchema = z.object({
  project_id: z.uuid(),
  group_key: z.enum(['lumber', 'roofing', 'finish_ext', 'finish_int', 'foundation']),
  option_key: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9_]+$/),
  label: z.string().trim().min(1),
  is_default: z.boolean(),
  sort: z.number().int(),
  image_url: z.string(),
  human_description: z.string(),
  price_hint: z.string(),
  is_beginner_choice: z.boolean(),
  beginner_advice: z.string(),
});
export const configOptionUpdateSchema = configOptionSchema.partial();
export type ConfigOptionInput = z.infer<typeof configOptionSchema>;

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
