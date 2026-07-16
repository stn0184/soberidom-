'use client';

import { cn } from '@/lib/utils';
import type { BuildStage } from '@/components/build/build-types';

const COLOR_DOT: Record<string, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

// Сайдбар этапов (SPEC 4.7, v1.5): цветовой маркер + display_name + mini-progress.
// Блокировок нет — все этапы открыты.
export function StageSidebar({
  stages,
  currentStageId,
  onSelectStage,
}: {
  stages: BuildStage[];
  currentStageId: string | null;
  onSelectStage: (stageId: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {stages.map((stage) => {
        const done = stage.steps.filter((s) => s.done).length;
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelectStage(stage.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
              stage.id === currentStageId && 'bg-accent font-medium'
            )}
          >
            {stage.color && (
              <span className={cn('size-2.5 shrink-0 rounded-full', COLOR_DOT[stage.color])} />
            )}
            <span className="flex-1 truncate">{stage.displayName}</span>
            <span className="text-xs text-muted-foreground">
              {done}/{stage.steps.length}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
