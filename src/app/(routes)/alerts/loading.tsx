export default function AlertsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
          </div>
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="gold-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted/50 rounded" />
                <div className="h-3 w-40 bg-muted/30 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 rounded-xl bg-muted/50" />
                <div className="w-9 h-9 rounded-xl bg-muted/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
