'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ru } from '@/lib/i18n/ru';

type ListStatesProps = {
  loading: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
  children: React.ReactNode;
};

// Обязательные состояния каждого экрана: Loading / Empty / Error (SPEC Блок 4).
export function ListStates({ loading, error, empty, onRetry, children }: ListStatesProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{ru.admin.common.loadError}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {ru.common.retry}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (empty) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">{ru.admin.common.emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{ru.admin.common.emptyText}</p>
      </div>
    );
  }
  return <>{children}</>;
}
