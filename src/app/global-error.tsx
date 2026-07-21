"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-background text-foreground">
        <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-5 px-4">
          <div className="w-24 h-24 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-2xl shadow-gold-500/30">
            <span className="text-white font-black text-4xl">!</span>
          </div>
          <div>
            <h1 className="text-2xl font-black mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-muted-foreground text-sm">
              حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
            </p>
            {process.env.NODE_ENV === "development" && error.digest && (
              <p className="text-muted-foreground/50 text-xs mt-2 font-mono">
                {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-gradient text-white font-bold text-sm shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all hover:scale-105 min-h-[44px]"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
