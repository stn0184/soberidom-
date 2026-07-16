import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ru } from '@/lib/i18n/ru';

const t = ru.my.hub;

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

export type JourneyStage = {
  id: string;
  number: number;
  displayName: string;
  color: string | null;
  intro: string;
  durationDays: number | null;
  resultImageUrl: string;
  doneSteps: number;
  totalSteps: number;
};

// «Карта путешествия» (ВИДЕНИЕ 2.1): вся стройка целиком, свобода навигации (2.2) —
// клик в любой этап открывает его в конструкторе, блокировок нет.
export function JourneyMap({
  purchaseId,
  stages,
}: {
  purchaseId: string;
  stages: JourneyStage[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage) => (
        <Link key={stage.id} href={`/my/${purchaseId}/build?stage=${stage.id}`}>
          <Card className="h-full overflow-hidden pt-0 transition-colors hover:bg-accent/50">
            <div className="relative aspect-video bg-muted">
              {stage.resultImageUrl ? (
                <Image
                  src={stage.resultImageUrl}
                  alt={t.stageResultAlt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground/40">
                  {stage.number}
                </div>
              )}
              {stage.durationDays !== null && (
                <Badge variant="secondary" className="absolute right-2 top-2 gap-1">
                  <Clock className="size-3" />
                  {t.stageDuration(stage.durationDays)}
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {stage.color && (
                  <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[stage.color])} />
                )}
                <span className="flex-1">
                  {stage.number}. {stage.displayName}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardTitle>
              {stage.intro && (
                <p className="text-sm text-muted-foreground">{stage.intro}</p>
              )}
            </CardHeader>
            <CardContent className="mt-auto space-y-1.5">
              <Progress
                value={stage.totalSteps > 0 ? (stage.doneSteps / stage.totalSteps) * 100 : 0}
              />
              <p className="text-xs text-muted-foreground">
                {t.stageSteps(stage.doneSteps, stage.totalSteps)}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
