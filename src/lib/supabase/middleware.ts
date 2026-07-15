import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Приватные разделы (SPEC: Маршруты) — без сессии редирект на /auth/login?next=…
const PROTECTED_PREFIXES = ['/my', '/settings', '/admin'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Никакого кода между createServerClient и getUser() —
  // иначе возможны случайные разлогины (рекомендация Supabase).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
