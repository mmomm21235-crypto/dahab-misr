import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط وأحكام استخدام تطبيق ذهب مصر",
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <span className="text-white font-black text-lg">ذ</span>
        </div>
        <div>
          <h1 className="font-black text-lg">شروط الاستخدام</h1>
          <p className="text-xs text-muted-foreground">آخر تحديث: يوليو 2025</p>
        </div>
      </div>

      <div className="gold-card p-6 space-y-4">
        <h2 className="font-bold text-base gold-text">مقدمة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          باستخدامك لتطبيق ذهب مصر، فإنك توافق على شروط الاستخدام هذه. إذا كنت لا توافق
          على هذه الشروط، يرجى عدم استخدام التطبيق.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">وصف الخدمة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تطبيق ذهب مصر هو خدمة لمتابعة أسعار الذهب في مصر. الأسعار المعروضة هي للاسترشاد
          فقط ولا تمثل عروض بيع أو شراء فعلية.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">المعلومات والبيانات</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
          <li>الأسعار تُحدث من مصادر خارجية وقد تتأخر</li>
          <li>نحن غير مسؤولين عن أي خسائر مالية ناتجة عن استخدام التطبيق</li>
          <li>الرسوم البيانية والتحليلات لأغراض معلوماتية فقط</li>
        </ul>

        <h2 className="font-bold text-base gold-text mt-6">المسؤولية</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تطبيق ذهب مصر غير مسؤول عن أي قرارات شراء أو بيع تتخذها بناءً على الأسعار
          المعروضة في التطبيق. ننصحك دائماً بالتأكد من الأسعار من مصادر متعددة قبل
          اتخاذ أي قرارات مالية.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">الملكية الفكرية</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          جميع حقوق التطبيق والعلامات التجارية المرتبطة به محفوظة لتطبيق ذهب مصر.
          لا يجوز نسخ أو إعادة توزيع أي جزء من التطبيق دون إذن خطي.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">إخلاء المسؤولية</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          يُقدم التطبيق "كما هو" دون أي ضمانات. نحن لا نضمن أن التطبيق سيعمل دون انقطاع
          أو أنه خالٍ من الأخطاء.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">التعديلات</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطرك بالتغييرات عبر التطبيق.
          استمرار استخدام التطبيق بعد التعديل يعني موافقتك على الشروط المعدلة.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">القانون الواجب التطبيق</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          تخضع هذه الشروط للقوانين المصرية. في حالة وجود أي نزاع، يتم حله أمام محاكم
          جمهورية مصر العربية.
        </p>
      </div>
    </div>
  );
}
