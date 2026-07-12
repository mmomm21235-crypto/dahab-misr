import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حول التطبيق",
  description: "معلومات عن تطبيق ذهب مصر - أسعار الذهب في مصر لحظة بلحظة",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <span className="text-white font-black text-lg">ذ</span>
        </div>
        <div>
          <h1 className="font-black text-lg">حول التطبيق</h1>
          <p className="text-xs text-muted-foreground">ذهب مصر - أسعار الذهب لحظة بلحظة</p>
        </div>
      </div>

      <div className="gold-card p-6 space-y-4">
        <h2 className="font-bold text-base gold-text">من نحن؟</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تطبيق ذهب مصر هو أول تطبيق مصري متخصص في متابعة أسعار الذهب في السوق المصري
          لحظة بلحظة. نقدم لك أسعار الذهب لجميع العيارات (24، 21، 18، 14) محدثة فوراً
          من مصادر موثوقة.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">مميزات التطبيق</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-3 list-disc list-inside">
          <li>أسعار الذهب لحظية لجميع العيارات</li>
          <li>حاسبة الذهب لحساب قيمة المشغولات الذهبية</li>
          <li>رسوم بيانية تفاعلية لتاريخ الأسعار</li>
          <li>تنبيهات فورية عند تغير الأسعار</li>
          <li>أخبار الذهب المحلية والعالمية</li>
          <li>يعمل بدون إنترنت (يدعم التصفح دون اتصال)</li>
          <li>واجهة عربية بسيطة وسهلة الاستخدام</li>
        </ul>

        <h2 className="font-bold text-base gold-text mt-6">مصادر البيانات</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          يتم تحديث أسعار الذهب من خلال واجهات برمجة تطبيقات (APIs) موثوقة مثل GoldAPI.io
          وسعر صرف الدولار من مصادر مالية رسمية. جميع الأسعار للاسترشاد فقط ولا تعتبر
          عروض بيع أو شراء.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">التواصل والدعم</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          للإبلاغ عن مشكلة أو اقتراح تحسين، تواصل معنا عبر البريد الإلكتروني أو سجل
          مشكلتك في صفحة الإعدادات.
        </p>
      </div>

      <div className="gold-card p-6 text-center">
        <div className="w-14 h-14 rounded-3xl bg-gold-gradient mx-auto flex items-center justify-center mb-3 shadow-lg shadow-gold-500/30">
          <span className="text-white font-black text-2xl">ذ</span>
        </div>
        <p className="font-black text-base gold-text">ذهب مصر</p>
        <p className="text-xs text-muted-foreground mt-1">الإصدار 2.0.0</p>
        <p className="text-xs text-muted-foreground mt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
