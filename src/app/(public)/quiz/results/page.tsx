import type { Metadata } from 'next';
import { QuizResults } from '@/components/quiz/quiz-results';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.results.title} — ${ru.common.appName}`,
};

export default function QuizResultsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{ru.results.title}</h1>
      <QuizResults />
    </div>
  );
}
