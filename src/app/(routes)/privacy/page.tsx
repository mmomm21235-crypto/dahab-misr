import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لتطبيق ذهب مصر - كيفية جمع وحماية بياناتك",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <span className="text-white font-black text-lg">ذ</span>
        </div>
        <div>
          <h1 className="font-black text-lg">سياسة الخصوصية</h1>
          <p className="text-xs text-muted-foreground">آخر تحديث: يوليو 2026</p>
        </div>
      </div>

      <div className="gold-card p-6 space-y-4">
        <h2 className="font-bold text-base gold-text">مقدمة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          نحن في تطبيق ذهب مصر نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية
          جمع واستخدام وحماية بياناتك عند استخدام تطبيقنا.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">البيانات التي نجمعها</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
          <li><strong>بيانات التطبيق:</strong> تفضيلات المظهر (داكن/فاتح)، إعدادات الإشعارات، التنبيهات التي تنشئها</li>
          <li><strong>بيانات محلية:</strong> جميع بياناتك تُخزن على جهازك المحلي باستخدام IndexedDB ولا تُرفع إلى سيرفراتنا</li>
          <li><strong>حساب Google:</strong> إذا اخترت تسجيل الدخول بحساب Google، نحصل فقط على اسمك وبريدك الإلكتروني</li>
        </ul>

        <h2 className="font-bold text-base gold-text mt-6">كيف نستخدم بياناتك</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
          <li>تقديم خدمة متابعة أسعار الذهب</li>
          <li>إرسال تنبيهات الأسعار التي اخترتها</li>
          <li>تحسين أداء التطبيق وتجربة المستخدم</li>
        </ul>

        <h2 className="font-bold text-base gold-text mt-6">حماية البيانات</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          نستخدم أفضل ممارسات الأمان لحماية بياناتك. جميع الاتصالات مشفرة عبر HTTPS.
          بيانات التنبيهات و الإعدادات تُخزن محلياً على جهازك ولا نشاركها مع أي طرف ثالث.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">ملفات تعريف الارتباط (Cookies)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          نستخدم ملفات تعريف الارتباط الضرورية فقط لتشغيل التطبيق. لا نستخدم ملفات
          تعريف ارتباط للتتبع أو الإعلانات.
        </p>

        <h2 className="font-bold text-base gold-text mt-6">حقوقك</h2>
        <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
          <li>لك الحق في حذف جميع بياناتك في أي وقت من صفحة الإعدادات</li>
          <li>لك الحق في إيقاف الإشعارات في أي وقت</li>
          <li>لا نحتفظ ببياناتك على سيرفراتنا بعد حذف حسابك</li>
        </ul>

        <h2 className="font-bold text-base gold-text mt-6">تغييرات سياسة الخصوصية</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر
          التطبيق.
        </p>
      </div>
    </div>
  );
}
