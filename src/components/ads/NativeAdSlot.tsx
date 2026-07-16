"use client";

interface NativeAdSlotProps {
  className?: string;
}

const AD_ENABLED = false;

export function NativeAdSlot({ className = "" }: NativeAdSlotProps) {
  if (!AD_ENABLED) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3 ${className}`}
      aria-label="إعلان"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <svg
          className="h-6 w-6 text-muted-foreground/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 h-3 w-24 rounded bg-muted/50" />
        <div className="h-2.5 w-full rounded bg-muted/30" />
      </div>
    </div>
  );
}
