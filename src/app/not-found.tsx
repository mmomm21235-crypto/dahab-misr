import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gold-gradient flex items-center justify-center mb-6 shadow-lg shadow-gold-500/30">
        <span className="text-white font-black text-3xl">ذ</span>
      </div>
      <h1 className="text-6xl font-black text-muted-foreground/30 mb-4">٤٠٤</h1>
      <h2 className="text-xl font-bold mb-2">الصفحة غير موجودة</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        يبدو أن هذه الصفحة لم تعد متاحة أو تم نقلها. تأكد من صحة الرابط أو عد إلى الصفحة الرئيسية.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-gold-gradient text-white font-bold text-sm shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all hover:scale-105 active:scale-95"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
