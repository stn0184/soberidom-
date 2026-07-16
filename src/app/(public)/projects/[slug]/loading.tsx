import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="aspect-video w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
