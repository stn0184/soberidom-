import { z } from 'zod';

// SPEC 3.1 QuizSchema (форма из SPEC, идиомы Zod 4).
export const quizSchema = z.object({
  buildingType: z.enum(['house', 'banya', 'hozblok', 'garage']),
  style: z
    .enum(['classic', 'barnhouse', 'scandinavian', 'a_frame', 'chalet', 'mini', 'any'])
    .default('any'),
  floors: z.union([z.literal(1), z.literal(2), z.literal(0)]).default(0), // 0 = не важно
  rooms: z.number().int().min(1).max(10).optional(),
  areaM2: z.number().min(10).max(400),
  regionId: z.uuid(),
  heating: z.enum(['gas', 'electric', 'solid_fuel', 'undecided']).default('undecided'),
  budgetMinor: z.number().int().positive().nullable().default(null),
});
export type QuizInput = z.infer<typeof quizSchema>;

// SPEC 3.5 FoundationSchema.
export const foundationSchema = z.object({
  regionId: z.uuid(),
  soil: z.enum(['clay', 'loam', 'sandy_loam', 'sand', 'peat', 'unknown']),
  highWater: z.enum(['yes', 'no', 'unknown']),
  relief: z.enum(['flat', 'slope']),
  projectId: z.uuid(),
});
export type FoundationInput = z.infer<typeof foundationSchema>;
