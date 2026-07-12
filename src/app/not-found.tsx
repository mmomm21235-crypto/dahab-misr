import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 px-4">
      <div className="w-24 h-24 rounded-3xl bg-gold-gradient flex items-center justify-center shadow-2xl shadow-gold-500/30 animate-float">
        <span className="text-white font-black text-4xl">٤٠٤</span>
      </div>
      <div>
        <h1 className="text-2xl font-black mb-2">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground text-sm">
          عذراً، الصفحة التي تبحث عنها غير موجودة
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-gradient text-white font-bold text-sm shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all hover:scale-105"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
