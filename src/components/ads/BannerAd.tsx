"use client";

interface BannerAdProps {
  className?: string;
}

const AD_ENABLED = false;

export function BannerAd({ className = "" }: BannerAdProps) {
  if (!AD_ENABLED) return null;

  return (
    <div
      className={`w-full rounded-xl border border-border/50 bg-card/50 p-3 text-center ${className}`}
      aria-label="إعلان"
    >
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
        </svg>
        <span>مساحة إعلانية</span>
      </div>
    </div>
  );
}
