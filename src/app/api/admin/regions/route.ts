import { NextResponse } from 'next/server';
import { dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { regionSchema } from '@/lib/zod/admin';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from('regions')
    .select('*')
    .order('country_code')
    .order('name');
  if (error) return dbError(error);
  return NextResponse.json({ data, meta: { total: data.length } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = regionSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('regions')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
