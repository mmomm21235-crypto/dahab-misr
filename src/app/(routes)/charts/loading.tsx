export default function ChartsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
      </div>
      <div className="h-80 rounded-2xl bg-muted/50 border border-border" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 flex-1 rounded-xl bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
