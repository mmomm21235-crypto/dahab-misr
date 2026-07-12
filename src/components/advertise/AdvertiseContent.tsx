"use client";

import { MessageCircle, Newspaper, Users, Target, BarChart3 } from "lucide-react";

const WHATSAPP_NUMBER = "201159130500";
const WHATSAPP_MESSAGE = encodeURIComponent("مرحباً، أريد الإعلان في تطبيق ذهب مصر");

const PACKAGES = [
  {
    title: "باقة متجر",
    price: "يُحدد لاحقاً",
    features: [
      "ظهور في دليل محلات الذهب",
      "رابط واتساب مباشر",
      "رابط جوجل ماب",
      "تحديث البيانات مجاناً",
    ],
    icon: StoreIcon,
  },
  {
    title: "باقة مميزة",
    price: "يُحدد لاحقاً",
    features: [
      "كل مميزات الباقة الأساسية",
      "ظهور مميز في أول الدليل",
      "بانر إعلاني في الصفحة الرئيسية",
      "تحليلات عدد الزوار",
    ],
    icon: StarIcon,
  },
];

function StoreIcon({ className }: { className?: string }) {
  return <Newspaper className={className} />;
}

function StarIcon({ className }: { className?: string }) {
  return <Target className={className} />;
}

export function AdvertiseContent() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">إعلن معنا</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          وصول لأكثر من ١٠٠٠ زائر يومياً من المهتمين بأسعار الذهب في مصر
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-bold">جمهور مستهدف</h3>
          <p className="text-sm text-muted-foreground">
            زوار التطبيق يبحثون تحديداً عن الذهب — سواء شراء أو بيع أو متابعة للأسعار
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="font-bold">نتائج مضمونة</h3>
          <p className="text-sm text-muted-foreground">
            روابط مباشرة للواتساب — العميل يكلمك ضغط زر واحده
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.title}
            className="p-6 rounded-2xl bg-card border border-border/50 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <pkg.icon className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              </div>
              <div>
                <h3 className="font-bold">{pkg.title}</h3>
                <p className="text-lg font-black gold-text">{pkg.price}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center pb-8">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-gradient text-white font-medium hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="w-4 h-4" />
          تواصل معنا عبر واتساب
        </a>
      </div>
    </div>
  );
}
