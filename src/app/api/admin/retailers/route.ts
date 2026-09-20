import { NextResponse } from 'next/server';
import { dbError, requireAdmin } from '@/lib/api/helpers';

// Справочник ритейлеров для формы цены (спека 005): у вида «ритейлер»
// админ выбирает источник из списка, а не набирает название руками.
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from('retailers')
    .select('id, name, country_code')
    .order('name');
  if (error) return dbError(error);
  return NextResponse.json({ data });
}
