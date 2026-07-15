import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { ru } from '@/lib/i18n/ru';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold">
            {ru.common.appName}
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  {ru.nav.logout}
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">{ru.nav.login}</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl space-y-1 px-4 py-6 text-sm text-muted-foreground">
          <p>{ru.footer.disclaimer}</p>
          <p>
            © {new Date().getFullYear()} {ru.common.appName}
          </p>
        </div>
      </footer>
    </div>
  );
}
