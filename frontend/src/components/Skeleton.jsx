import { cn } from '../lib/utils';

function Bar({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-black/[.06]', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="mb-3 flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-line/60">
      <Bar className="size-3 rounded-full" />
      <div className="flex-1 space-y-2">
        <Bar className="h-4 w-1/2" />
        <Bar className="h-3 w-3/4" />
      </div>
      <Bar className="h-6 w-14 rounded-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b border-black/5 bg-white/70" />
      <div className="mx-auto max-w-3xl px-5 pt-16">
        <Bar className="mb-3 h-4 w-24" />
        <Bar className="mb-12 h-12 w-2/3" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
