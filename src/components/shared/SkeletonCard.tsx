import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer rounded-lg bg-muted",
        className
      )}
    />
  );
}

export function GoldPriceCardSkeleton() {
  return (
    <div className="gold-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="gold-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      </div>
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="gold-card p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
