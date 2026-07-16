import type { Metadata } from 'next';
import { QuizForm } from '@/components/quiz/quiz-form';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: `${ru.quiz.title} — ${ru.common.appName}`,
};

export default function QuizPage() {
  return <QuizForm />;
}
