"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  Share2,
  Star,
  Info,
  ChevronLeft,
  Download,
  Trash2,
  Shield,
  RefreshCw,
  FileDown,
  Volume2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSettingsStore } from "@/stores/settingsStore";
import { clearCache } from "@/lib/storage";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CURRENCIES } from "@/lib/currencies";

const THEME_OPTIONS = [
  { value: "light" as const, label: "فاتح", Icon: Sun },
  { value: "dark" as const, label: "داكن", Icon: Moon },
  { value: "system" as const, label: "تلقائي", Icon: Monitor },
];

const REFRESH_OPTIONS = [
  { value: 600, label: "١٠ دقايق" },
  { value: 900, label: "١٥ دقيقة" },
];

function SettingRow({
  icon: Icon,
  label,
  description,
  action,
  iconColor = "text-gold-500",
  iconBg = "bg-gold-500/10",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  action: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

export function SettingsContent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const [notifications, setNotifications] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(settings.refreshInterval ?? 600);
  const handleShare = async () => {
    const shareData = {
      title: "ذهب مصر",
      text: "تطبيق رائع لمتابعة أسعار الذهب في مصر",
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await navigator.clipboard.writeText(shareData.url).catch(() => {});
        toast.success("تم نسخ رابط التطبيق");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("تم نسخ رابط التطبيق");
      } catch {
        prompt("انسخ الرابط:", shareData.url);
      }
    }
  };

  const handleClearCache = () => {
    clearCache();
    toast.success("تم مسح الذاكرة المؤقتة");
  };

  const handleRating = () => {
    toast.success("شكراً لتقييمك!");
  };

  const handleInstall = async () => {
    const d = (window as any).__deferredPrompt;
    if (d) {
      d.prompt();
      await d.userChoice;
      (window as any).__deferredPrompt = null;
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      toast.success("افتح سفاري ← زر المشاركة ← إضافة للشاشة الرئيسية");
    } else {
      toast.success("افتح قائمة المتصفح ← اختر 'تثبيت التطبيق'");
    }
  };

  const handleToggleNotifications = async () => {
    if (!notifications) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifications(true);
        toast.success("تم تفعيل الإشعارات");
      } else {
        toast.error("يرجى السماح بالإشعارات من إعدادات المتصفح");
      }
    } else {
      setNotifications(false);
      toast.info("تم إيقاف الإشعارات");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch("/api/gold-prices/history?period=month");
      const json = await res.json();
      if (!json.success || !json.data?.length) {
        toast.error("لا توجد بيانات كافية للتصدير");
        return;
      }

      const headers = "التاريخ,عيار 24,عيار 21,عيار 18\n";
      const rows = json.data
        .map((d: any) => `${d.date},${d.price24},${d.price21},${d.price18}`)
        .join("\n");
      const csv = "\uFEFF" + headers + rows;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gold-prices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير الملف بنجاح");
    } catch {
      toast.error("فشل تصدير البيانات");
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-black text-lg">الإعدادات</h1>
          <p className="text-xs text-muted-foreground">تخصيص التطبيق</p>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        className="gold-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">المظهر</h2>
        <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-2xl mb-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all duration-200",
                theme === value
                  ? "bg-card shadow-sm text-gold-600 dark:text-gold-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {resolvedTheme === "dark" ? "داكن" : "فاتح"}
        </p>
      </motion.div>

      {/* Refresh Interval */}
      <motion.div
        className="gold-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">التحديث التلقائي</h2>
        <SettingRow
          icon={RefreshCw}
          label="فترة التحديث"
          description="المدة بين كل تحديث للأسعار"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          action={
            <select
              value={refreshInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRefreshInterval(val);
                updateSettings({ refreshInterval: val });
              }}
              className="text-xs font-bold bg-muted border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold-500"
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          }
        />
      </motion.div>

      {/* Currency */}
      <motion.div
        className="gold-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">العملة</h2>
        <div className="grid grid-cols-2 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => updateSettings({ currency: c.code })}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border",
                settings.currency === c.code
                  ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400"
                  : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex flex-col items-start leading-tight">
                <span>{c.code}</span>
                <span className="text-[10px] font-normal opacity-70">{c.name}</span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notifications & Sound */}
      <motion.div
        className="gold-card p-5 space-y-1 divide-y divide-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">الإشعارات</h2>
        <SettingRow
          icon={Bell}
          label="تنبيهات الأسعار"
          description="استلم إشعاراً عند تغيّر الأسعار"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          action={
            <button
              onClick={handleToggleNotifications}
              role="switch"
              aria-checked={notifications}
              aria-label="تنبيهات الأسعار"
              className={cn("w-12 h-6 rounded-full transition-all duration-200 relative min-h-[44px] min-w-[44px] flex items-center", notifications ? "bg-gold-500" : "bg-muted")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm absolute top-1/2 -translate-y-1/2 transition-all duration-200", notifications ? "start-6" : "start-0.5")} />
            </button>
          }
        />
        <SettingRow
          icon={Volume2}
          label="صوت التنبيه"
          description="تشغيل صوت عند تفعيل التنبيه"
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
          action={
            <button
              onClick={() => updateSettings({ alertSound: !settings.alertSound })}
              role="switch"
              aria-checked={settings.alertSound}
              aria-label="صوت التنبيه"
              className={cn("w-12 h-6 rounded-full transition-all duration-200 relative min-h-[44px] min-w-[44px] flex items-center", settings.alertSound ? "bg-gold-500" : "bg-muted")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm absolute top-1/2 -translate-y-1/2 transition-all duration-200", settings.alertSound ? "start-6" : "start-0.5")} />
            </button>
          }
        />
      </motion.div>

      {/* Export */}
      <motion.div
        className="gold-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">تصدير البيانات</h2>
        <button type="button" onClick={handleExportCsv} className="w-full">
          <SettingRow
            icon={FileDown}
            label="تصدير CSV"
            description="تاريخ أسعار الذهب للشهر الأخير"
            iconBg="bg-green-500/10"
            iconColor="text-green-500"
            action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />}
          />
        </button>
      </motion.div>

      {/* App Actions */}
      <motion.div
        className="gold-card p-5 space-y-1 divide-y divide-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">التطبيق</h2>
        <button type="button" onClick={handleShare} className="w-full text-right">
          <SettingRow icon={Share2} label="مشاركة التطبيق" iconBg="bg-green-500/10" iconColor="text-green-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </button>
        <button type="button" onClick={handleRating} className="w-full text-right">
          <SettingRow icon={Star} label="تقييم التطبيق" iconBg="bg-yellow-500/10" iconColor="text-yellow-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </button>
        <button type="button" onClick={handleClearCache} className="w-full text-right">
          <SettingRow icon={Trash2} label="مسح الذاكرة المؤقتة" iconBg="bg-red-500/10" iconColor="text-red-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </button>
      </motion.div>

      {/* About */}
      <motion.div
        className="gold-card p-5 space-y-1 divide-y divide-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-bold text-xs text-muted-foreground mb-4">حول التطبيق</h2>
        <div className="py-3">
          <SettingRow
            icon={Info}
            label="الإصدار"
            iconBg="bg-purple-500/10"
            iconColor="text-purple-500"
            action={<span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">2.0.0</span>}
          />
        </div>
        <Link href="/privacy" className="block py-3">
          <SettingRow icon={Shield} label="سياسة الخصوصية" description="بياناتك محفوظة بالكامل على جهازك" iconBg="bg-green-500/10" iconColor="text-green-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </Link>
        <Link href="/terms" className="block py-3">
          <SettingRow icon={Shield} label="شروط الاستخدام" description="شروط وأحكام استخدام التطبيق" iconBg="bg-blue-500/10" iconColor="text-blue-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </Link>
        <Link href="/about" className="block py-3">
          <SettingRow icon={Info} label="حول التطبيق" description="معلومات عن ذهب مصر" iconBg="bg-purple-500/10" iconColor="text-purple-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
        </Link>
        <button type="button" onClick={handleInstall} className="w-full text-right">
          <div className="py-3">
            <SettingRow icon={Download} label="تثبيت التطبيق" description="أضف ذهب مصر إلى الشاشة الرئيسية" iconBg="bg-gold-500/10" iconColor="text-gold-500" action={<ChevronLeft className="w-4 h-4 text-muted-foreground" />} />
          </div>
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="text-center py-4 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <div className="w-14 h-14 rounded-3xl bg-gold-gradient mx-auto flex items-center justify-center mb-3 shadow-lg shadow-gold-500/30">
          <span className="text-white font-black text-2xl">ذ</span>
        </div>
        <p className="font-black text-base gold-text">ذهب مصر</p>
        <p className="text-xs text-muted-foreground">أسعار الذهب لحظياً في مصر</p>
        <p className="text-xs text-muted-foreground mt-2">الأسعار للاسترشاد فقط</p>
      </motion.div>
    </motion.div>
  );
}


