import Link from 'next/link';
import { ru } from '@/lib/i18n/ru';

// Минимальный layout анкеты: только лого и контент (SPEC 4.2).
export default function QuizLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-16 w-full max-w-2xl items-center px-4">
        <Link href="/" className="text-lg font-semibold">
          {ru.common.appName}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16">{children}</main>
    </div>
  );
}
