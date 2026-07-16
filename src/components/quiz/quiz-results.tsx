'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard, type ProjectCardData } from '@/components/quiz/project-card';
import { ru } from '@/lib/i18n/ru';

type MatchResponse = {
  data: Array<ProjectCardData & { matchScore: number }>;
  meta: { total: number; relaxed: boolean };
};

type State =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; value: MatchResponse };

// Результаты подбора (SPEC 4.3): читаются из sessionStorage (записаны анкетой).
export function QuizResults() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = sessionStorage.getItem('sd_quiz_result');
        if (!raw) {
          setState({ kind: 'error' });
          return;
        }
        setState({ kind: 'ready', value: JSON.parse(raw) as MatchResponse });
      } catch {
        setState({ kind: 'error' });
      }
    });
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{ru.results.error}</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/quiz">{ru.results.retryQuiz}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const { data, meta } = state.value;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {ru.results.empty}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {meta.relaxed && (
        <Alert>
          <TriangleAlert />
          <AlertDescription>{ru.results.relaxedBanner}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {data.map((card) => (
          <ProjectCard key={card.slug} project={card} />
        ))}
      </div>
    </div>
  );
}
