import { NextResponse } from 'next/server';
import { dbError, parseJson, requireAdmin, validationError } from '@/lib/api/helpers';
import { projectSchema } from '@/lib/zod/admin';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from('house_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return dbError(error);
  return NextResponse.json({ data, meta: { total: data.length } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const parsed = projectSchema.safeParse(await parseJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const { data, error } = await auth.supabase
    .from('house_projects')
    .insert(parsed.data)
    .select()
    .single();
  if (error) return dbError(error);
  return NextResponse.json({ data }, { status: 201 });
}
