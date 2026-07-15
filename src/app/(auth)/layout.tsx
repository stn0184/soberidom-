import Link from 'next/link';
import { ru } from '@/lib/i18n/ru';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Link href="/" className="text-xl font-semibold">
        {ru.common.appName}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        {ru.footer.disclaimer}
      </p>
    </div>
  );
}
