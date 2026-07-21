export default function ShopsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-3xl bg-muted mx-auto mb-4" />
        <div className="h-7 w-40 bg-muted rounded mx-auto" />
        <div className="h-4 w-56 bg-muted/50 rounded mx-auto mt-2" />
      </div>
      <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-16 rounded-xl bg-muted/50" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 flex-1 rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
