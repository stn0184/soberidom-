'use client';

// Прототип 003: экран начала этапа целиком — сайдбар конструктора + шапка
// этапа + закупки + инструменты + «Начать этап». Кнопки не работают.
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StageSidebar } from '@/components/build/stage-sidebar';
import { cn } from '@/lib/utils';
import {
  CURRENT_STAGE,
  POSITIONS,
  STAGES,
  STAGE_DURATION_DAYS,
  TOOLS,
  proto,
} from './mock';
import {
  EmptyBlock,
  MaterialsBlock,
  NeedRegionBlock,
  ToolsBlock,
} from './stage-supplies-preview';

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

export type Variant = 'normal' | 'empty' | 'needRegion';

export function StageStartPreview({ variant }: { variant: Variant }) {
  const stage = CURRENT_STAGE;

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside>
        <StageSidebar stages={STAGES} currentStageId={stage.id} onSelectStage={() => {}} />
      </aside>

      <div className="min-w-0 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {stage.color && (
              <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[stage.color])} />
            )}
            <span>{proto.stageHead(stage.number, stage.displayName)}</span>
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3" />
              {proto.duration(STAGE_DURATION_DAYS)}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{stage.displayName}</h1>
          <p className="max-w-2xl text-base text-muted-foreground">{stage.intro}</p>
        </header>

        {variant === 'normal' && (
          <>
            <MaterialsBlock positions={POSITIONS} />
            <ToolsBlock tools={TOOLS} />
          </>
        )}
        {variant === 'needRegion' && (
          <>
            <NeedRegionBlock />
            <ToolsBlock tools={TOOLS} />
          </>
        )}
        {variant === 'empty' && <EmptyBlock />}

        <div className="flex flex-wrap items-center gap-4 border-t pt-6">
          <Button size="xl">{proto.startStage}</Button>
          <Link href="#" className="text-sm text-primary hover:underline">
            {proto.estimateAll}
          </Link>
        </div>
      </div>
    </div>
  );
}
