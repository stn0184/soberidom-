import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-9 w-96" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    </div>
  );
}
