import { NextResponse } from 'next/server';
import { dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { regionSchema, regionsImportSchema } from '@/lib/zod/admin';

// Импорт регионов из CSV (SPEC 3.16): name,country_code,mt,snow_region,wind_region.
// Upsert по паре (country_code, name): существующие обновляются.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = regionsImportSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const lines = parsed.data.csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let inserted = 0;
  let updated = 0;
  const badLines: number[] = [];

  for (const [index, line] of lines.entries()) {
    const cols = line.split(',').map((c) => c.trim());
    if (index === 0 && cols[0]?.toLowerCase() === 'name') continue; // строка-заголовок

    const row = regionSchema.safeParse({
      name: cols[0],
      country_code: cols[1]?.toUpperCase(),
      mt: Number(cols[2]),
      snow_region: Number(cols[3]),
      wind_region: Number(cols[4]),
    });
    if (!row.success) {
      badLines.push(index + 1);
      continue;
    }

    const { data: existing, error: findError } = await auth.supabase
      .from('regions')
      .select('id')
      .eq('country_code', row.data.country_code)
      .eq('name', row.data.name)
      .maybeSingle();
    if (findError) return dbError(findError);

    if (existing) {
      const { error } = await auth.supabase
        .from('regions')
        .update({
          mt: row.data.mt,
          snow_region: row.data.snow_region,
          wind_region: row.data.wind_region,
        })
        .eq('id', existing.id);
      if (error) return dbError(error);
      updated += 1;
    } else {
      const { error } = await auth.supabase.from('regions').insert(row.data);
      if (error) return dbError(error);
      inserted += 1;
    }
  }

  return NextResponse.json({ data: { inserted, updated, badLines } });
}
