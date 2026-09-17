import { NextResponse, type NextRequest } from 'next/server';
import { dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { toolVariantSchema } from '@/lib/zod/admin';

// Варианты сохраняются по одному, поэтому роут не знает правила «ровно один
// вариант для новичка» — его держит форма админки (спека 004).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = toolVariantSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('tool_variants')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
