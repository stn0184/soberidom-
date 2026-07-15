import { ru } from '@/lib/i18n/ru';

// Полноценный лендинг — этап 3 (SPEC 4.1). Здесь — минимальная заглушка каркаса.
export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {ru.home.heroTitle}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {ru.home.heroSubtitle}
      </p>
    </section>
  );
}
