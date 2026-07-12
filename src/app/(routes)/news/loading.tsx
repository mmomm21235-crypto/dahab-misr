export default function NewsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-20 rounded-xl bg-muted/50" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="gold-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-5 w-12 rounded-full bg-muted/50" />
                  <div className="h-4 w-20 bg-muted/50 rounded" />
                </div>
                <div className="h-4 w-full bg-muted/50 rounded" />
                <div className="h-3 w-3/4 bg-muted/30 rounded" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
