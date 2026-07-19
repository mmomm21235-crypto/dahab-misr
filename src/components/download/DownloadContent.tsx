"use client";

import Link from "next/link";
import {
  Download,
  Smartphone,
  TrendingUp,
  Calculator,
  Bell,
  Newspaper,
  Store,
  Shield,
  Zap,
  ExternalLink,
} from "lucide-react";

const APK_DOWNLOAD_URL =
  "https://github.com/mmomm21235-crypto/dahab-misr/releases/latest/download/app-debug.apk";
const RELEASES_URL =
  "https://github.com/mmomm21235-crypto/dahab-misr/releases";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "أسعار لحظية",
    desc: "تابع أسعار الذهب всех العيارات لحظة بلحظة",
  },
  {
    icon: Calculator,
    title: "حاسبة الذهب",
    desc: "احسب سعر ذهبك بالوزن والعيار ورسوم الصياغة",
  },
  {
    icon: Newspaper,
    title: "أخبار وتحليلات",
    desc: "آخر أخبار الذهب والاقتصاد المصري والعالمي",
  },
  {
    icon: Bell,
    title: "تنبيهات الأسعار",
    desc: "اعمل تنبيهات للأسعار اللي مهتم بيها",
  },
  {
    icon: Store,
    title: "دليل المحلات",
    desc: "اكتشف محلات الذهب القريبة منك",
  },
  {
    icon: Shield,
    title: "مجاني وآمن",
    desc: "بدون تسجيل مطلوب، خصوصيتك محمية",
  },
];

export function DownloadContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-900 via-gold-800 to-amber-900 p-8 text-white shadow-2xl shadow-gold-900/30">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white font-black text-3xl">ذ</span>
          </div>
          <h1 className="text-3xl font-black mb-2">ذهب مصر</h1>
          <p className="text-gold-200 text-sm mb-1">
            تطبيق أسعار الذهب في مصر
          </p>
          <p className="text-gold-300/70 text-xs">الإصدار 2.0.0</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="space-y-3">
        <a
          href={APK_DOWNLOAD_URL}
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-gold-gradient text-white font-bold text-lg shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-6 h-6" />
          تحميل التطبيق (Android)
        </a>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl bg-muted hover:bg-accent text-foreground font-medium text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          جميع الإصدارات على GitHub
        </a>
      </div>

      {/* How to install */}
      <div className="gold-card p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gold-500" />
          طريقة التثبيت
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center text-xs font-bold">
              ١
            </span>
            <span>
              اضغط على زر &quot;تحميل التطبيق&quot; أعلاه
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center text-xs font-bold">
              ٢
            </span>
            <span>
              عند اكتمال التحميل، افتح ملف APK
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center text-xs font-bold">
              ٣
            </span>
            <span>
              قد يطلب منك السماح بالتثبيت من مصادر غير معروفة — اضغط &quot;سماح&quot;
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center text-xs font-bold">
              ٤
            </span>
            <span>اضغط &quot;تثبيت&quot; واستمتع بالتطبيق</span>
          </li>
        </ol>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="font-bold text-base px-1">مميزات التطبيق</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="gold-card p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-bold text-sm">{title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PWA alternative */}
      <div className="gold-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold-500" />
          <h3 className="font-bold text-sm">أو استخدم النسخة الويب</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          يمكنك أيضًا إضافة الموقع إلى الشاشة الرئيسية مباشرة من المتصفح بدون
          تحميل أي ملف.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 font-bold hover:underline"
        >
          كيفية التثبيت من المتصفح
        </Link>
      </div>

      {/* QR Code */}
      <div className="gold-card p-5 text-center space-y-3">
        <h3 className="font-bold text-sm">امسح الرمز للفتح على الموبايل</h3>
        <div className="inline-block p-3 bg-white rounded-2xl">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://dahab-misr.vercel.app")}&bgcolor=ffffff&color=1a1a1a`}
            alt="QR Code لتطبيق ذهب مصر"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>
        <p className="text-xs text-muted-foreground">dahab-misr.vercel.app</p>
      </div>
    </div>
  );
}
