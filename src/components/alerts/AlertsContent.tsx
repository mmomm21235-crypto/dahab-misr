"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Plus, Trash2, BellOff, BellRing, TrendingUp, TrendingDown, Check, BellElectric,
  LogIn, Smartphone, SmartphoneNfc, History, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useGoldContext } from "@/context/GoldContext";
import {
  getAlerts, addAlert, deleteAlert, updateAlert, generateId,
} from "@/lib/storage";
import type { PriceAlert } from "@/types";
import { formatPrice, getKaratLabel, cn, formatShortDate } from "@/lib/utils";

interface AlertHistoryEntry {
  id: string;
  karat: string;
  targetPrice: number;
  currentPrice: number;
  condition: string;
  triggeredAt: string;
}

type TabType = "alerts" | "history";

const KARAT_OPTIONS: Array<{ value: PriceAlert["karat"]; label: string }> = [
  { value: 24, label: "عيار 24" },
  { value: 21, label: "عيار 21" },
  { value: 18, label: "عيار 18" },
  { value: "pound", label: "الجنيه الذهب" },
];

export function AlertsContent({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const { prices } = useGoldContext();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedKarat, setSelectedKarat] = useState<PriceAlert["karat"]>(21);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [alertType, setAlertType] = useState<"price" | "percent">("price");
  const [percentValue, setPercentValue] = useState("");

  const [activeTab, setActiveTab] = useState<TabType>("alerts");
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setAlerts(getAlerts());
  }, []);

  // Fetch alert history
  useEffect(() => {
    if (activeTab !== "history") return;
    setHistoryLoading(true);
    fetch("/api/alerts/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHistory(data.data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [activeTab]);

  // Check subscription status on mount
  useEffect(() => {
    if (!isMounted) return;
    if (!("Notification" in window)) { setPushSupported(false); return; }
    setIsSubscribed(Notification.permission === "granted");
  }, [isMounted]);

  // Check alerts against current prices
  useEffect(() => {
    if (!prices || alerts.length === 0) return;
    alerts.forEach((alert) => {
      if (!alert.isActive || alert.notified) return;
      let currentPrice = 0;
      if (alert.karat === 24) currentPrice = prices.karat24.buyPrice;
      else if (alert.karat === 21) currentPrice = prices.karat21.buyPrice;
      else if (alert.karat === 18) currentPrice = prices.karat18.buyPrice;
      else currentPrice = prices.pound.buyPrice;

      const triggered =
        (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice <= alert.targetPrice);

      if (triggered) {
        updateAlert(alert.id, { notified: true, triggeredAt: new Date().toISOString() });
        setAlerts(getAlerts());
        const msg = `${getKaratLabel(alert.karat)}: ${formatPrice(currentPrice)} ج.م`;
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("ذهب مصر - تنبيه أسعار", {
            body: msg, icon: "/icons/icon-192x192.png", dir: "rtl", lang: "ar",
          });
        }
        try {
          const settings = localStorage.getItem("dahab-misr-settings");
          if (settings) {
            const parsed = JSON.parse(settings);
            if (parsed.state?.settings?.alertSound !== false) { playAlertSound(); }
          } else { playAlertSound(); }
        } catch {}
        toast.success(msg, { duration: 6000 });
      }
    });
  }, [prices, alerts]);

  const handleAddAlert = () => {
    if (alertType === "price") {
      if (!targetPrice || parseFloat(targetPrice) <= 0) {
        toast.error("يرجى إدخال سعر صحيح"); return;
      }
      const newAlert: PriceAlert = {
        id: generateId(), karat: selectedKarat, targetPrice: parseFloat(targetPrice),
        condition, isActive: true, createdAt: new Date().toISOString(), notified: false,
      };
      addAlert(newAlert);
    } else {
      if (!percentValue || parseFloat(percentValue) <= 0) {
        toast.error("يرجى إدخال نسبة صحيحة"); return;
      }
      const currentPrice = getCurrentPrice(selectedKarat) ?? 0;
      if (currentPrice <= 0) { toast.error("لا يوجد سعر حالياً"); return; }
      const pct = parseFloat(percentValue);
      const target = condition === "above"
        ? Math.round(currentPrice * (1 + pct / 100))
        : Math.round(currentPrice * (1 - pct / 100));
      const newAlert: PriceAlert = {
        id: generateId(), karat: selectedKarat, targetPrice: target,
        condition, isActive: true, createdAt: new Date().toISOString(), notified: false,
      };
      addAlert(newAlert);
    }
    setAlerts(getAlerts());
    setTargetPrice(""); setPercentValue(""); setShowForm(false);
    toast.success("تم إضافة التنبيه بنجاح");
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التنبيه؟")) return;
    deleteAlert(id); setAlerts(getAlerts()); toast.success("تم حذف التنبيه");
  };

  const handleToggle = (id: string, current: boolean) => {
    updateAlert(id, { isActive: !current, notified: false });
    setAlerts(getAlerts());
  };

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const subscribePush = useCallback(async () => {
    if (!("Notification" in window)) { toast.error("المتصفح لا يدعم الإشعارات"); return; }
    if (Notification.permission === "denied") {
      toast.error("الإشعارات مرفوضة — افتح إعدادات المتصفح واسمح بها"); return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("لم يتم منح الإذن"); return; }

      if (!("serviceWorker" in navigator)) { toast.success("تم تفعيل الإشعارات ✅"); setIsSubscribed(true); return; }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) { await existing.unsubscribe(); }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { toast.success("تم تفعيل إشعارات المتصفح ✅"); setIsSubscribed(true); return; }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
      });

      if (isAuthenticated) {
        const res = await fetch("/api/push/subscribe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });
        if (!res.ok) throw new Error("API error");
      }

      setIsSubscribed(true);
      // Persist to localStorage for offline state
      try { localStorage.setItem("dahab-misr-push", "true"); } catch {}
      toast.success("🔔 تم تفعيل الإشعارات الفورية");
    } catch (err: any) {
      if (err.message?.includes("API")) {
        toast.success("تم تفعيل إشعارات المتصفح ✅");
        setIsSubscribed(true);
      } else {
        toast.error("فشل تفعيل الإشعارات — جرب مرة أخرى");
      }
    }
  }, [isAuthenticated]);

  const unsubscribePush = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      if (isAuthenticated) {
        await fetch("/api/push/unsubscribe", { method: "POST" });
      }
      setIsSubscribed(false);
      try { localStorage.removeItem("dahab-misr-push"); } catch {}
      toast.info("تم إيقاف الإشعارات");
    } catch { toast.error("فشل إيقاف الإشعارات"); }
  }, [isAuthenticated]);

  const getCurrentPrice = (karat: PriceAlert["karat"]) => {
    if (!prices) return null;
    if (karat === 24) return prices.karat24.buyPrice;
    if (karat === 21) return prices.karat21.buyPrice;
    if (karat === 18) return prices.karat18.buyPrice;
    return prices.pound.buyPrice;
  };

  const getKaratLabelForHistory = (karat: string) => {
    const labels: Record<string, string> = {
      "24": "عيار 24", "21": "عيار 21", "18": "عيار 18", pound: "الجنيه الذهب",
      K24: "عيار 24", K21: "عيار 21", K18: "عيار 18", POUND: "الجنيه الذهب",
    };
    return labels[karat] ?? karat;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    return formatShortDate(dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-lg shadow-gold-500/30">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg">التنبيهات</h1>
            <p className="text-xs text-muted-foreground">
              {alerts.filter((a) => a.isActive).length} تنبيه نشط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sign-in prompt for push */}
          {!isAuthenticated && pushSupported && (
            <a href="/auth/signin"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-gold-500/10 border border-gold-500/20 text-gold-600 dark:text-gold-400 hover:bg-gold-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">سجل للإشعارات</span>
            </a>
          )}

          {/* Push toggle */}
          {isAuthenticated && pushSupported && (
            <button
              onClick={isSubscribed ? unsubscribePush : subscribePush}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                isSubscribed
                  ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
              )}
            >
              {isSubscribed ? <SmartphoneNfc className="w-4 h-4" /> : <BellElectric className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSubscribed ? "مفعلة" : "إشعارات فورية"}</span>
            </button>
          )}

          {/* Push-only (no session) */}
          {!isAuthenticated && !pushSupported && (
            <button
              onClick={subscribePush}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all"
            >
              <BellElectric className="w-4 h-4" />
              <span className="hidden sm:inline">إشعارات فورية</span>
            </button>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold",
              "bg-gold-gradient text-white shadow-lg shadow-gold-500/30",
              "hover:shadow-gold-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
            )}
          >
            <Plus className="w-4 h-4" />
            تنبيه جديد
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
        <button
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === "alerts"
              ? "bg-gold-gradient text-white shadow-lg shadow-gold-500/20"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="w-4 h-4" />
          التنبيهات
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === "history"
              ? "bg-gold-gradient text-white shadow-lg shadow-gold-500/20"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="w-4 h-4" />
          السجل
        </button>
      </div>

      {/* Add Alert Form */}
      {showForm && activeTab === "alerts" && (
        <div className="gold-card p-5 space-y-4 animate-scale-in border-gold-500/30">
          <h2 className="font-bold text-base">إضافة تنبيه جديد</h2>

          {/* Alert Type */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">نوع التنبيه</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAlertType("price")}
                className={cn("py-3 rounded-xl border text-sm font-bold transition-all",
                  alertType === "price" ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400" : "border-border bg-muted/30 text-muted-foreground"
                )}>تنبيه سعر</button>
              <button onClick={() => setAlertType("percent")}
                className={cn("py-3 rounded-xl border text-sm font-bold transition-all",
                  alertType === "percent" ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400" : "border-border bg-muted/30 text-muted-foreground"
                )}>تنبيه نسبة تغيّر</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">العيار</label>
            <div className="grid grid-cols-2 gap-2">
              {KARAT_OPTIONS.map(({ value, label }) => (
                <button
                  key={String(value)}
                  onClick={() => setSelectedKarat(value)}
                  className={cn(
                    "py-3 rounded-xl border text-sm font-bold transition-all",
                    selectedKarat === value
                      ? "border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400"
                      : "border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">الشرط</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCondition("above")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                  condition === "above"
                    ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              ><TrendingUp className="w-4 h-4" />{alertType === "price" ? "يرتفع إلى" : "يزيد عن"}</button>
              <button
                onClick={() => setCondition("below")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all",
                  condition === "below"
                    ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              ><TrendingDown className="w-4 h-4" />{alertType === "price" ? "ينخفض إلى" : "يقل عن"}</button>
            </div>
          </div>

          {alertType === "price" ? (
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">السعر المستهدف (ج.م)</label>
              {prices && (
                <p className="text-xs text-muted-foreground mb-2">
                  السعر الحالي: <strong className="text-foreground">{formatPrice(getCurrentPrice(selectedKarat) ?? 0)} ج.م</strong>
                </p>
              )}
              <input
                type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="أدخل السعر المستهدف"
                className="w-full py-3 px-4 rounded-xl border bg-muted/50 text-lg font-bold text-center focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">النسبة المئوية (%)</label>
              {prices && (
                <p className="text-xs text-muted-foreground mb-2">
                  السعر الحالي: <strong className="text-foreground">{formatPrice(getCurrentPrice(selectedKarat) ?? 0)} ج.م</strong>
                </p>
              )}
              <input
                type="number" value={percentValue} onChange={(e) => setPercentValue(e.target.value)}
                placeholder="مثال: 5" min="0.1" step="0.1" inputMode="decimal"
                className="w-full py-3 px-4 rounded-xl border bg-muted/50 text-lg font-bold text-center focus:outline-none focus:border-gold-500 transition-colors"
              />
              {percentValue && prices && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  سيتم التنبيه عند {condition === "above" ? "الارتفاع" : "الانخفاض"} عن{" "}
                  <strong>{formatPrice(
                    condition === "above"
                      ? Math.round((getCurrentPrice(selectedKarat) ?? 0) * (1 + parseFloat(percentValue) / 100))
                      : Math.round((getCurrentPrice(selectedKarat) ?? 0) * (1 - parseFloat(percentValue) / 100))
                  )} ج.م</strong>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAddAlert}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-gradient text-white font-bold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all"
            ><Check className="w-4 h-4" />إضافة التنبيه</button>
            <button
              onClick={() => { setShowForm(false); setAlertType("price"); setPercentValue(""); }}
              className="px-5 py-3 rounded-xl border border-border bg-muted/50 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >إلغاء</button>
          </div>
        </div>
      )}

      {/* Push subscription CTA for non-logged-in */}
      {activeTab === "alerts" && !isAuthenticated && pushSupported && !isSubscribed && (
        <div className="gold-card p-4 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">الإشعارات الفورية</p>
              <p className="text-xs text-muted-foreground">سجل دخولك وفعل الإشعارات عشان يصلك تنبيه على الموبايل حتى لو الموقع مقفول</p>
            </div>
            <a
              href="/auth/signin"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-white text-xs font-bold shadow-lg shadow-gold-500/20"
            ><LogIn className="w-4 h-4" />تسجيل الدخول</a>
          </div>
        </div>
      )}

      {activeTab === "alerts" && isMounted && !isAuthenticated && pushSupported && Notification.permission === "default" && (
        <div className="gold-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <BellElectric className="w-5 h-5 text-gold-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">فعل الإشعارات</p>
              <p className="text-xs text-muted-foreground">استلم إشعار فوري عند تغير السعر</p>
            </div>
            <button
              onClick={subscribePush}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-white text-xs font-bold shadow-lg shadow-gold-500/20"
            ><BellElectric className="w-4 h-4" />تفعيل</button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {activeTab === "alerts" && (
        alerts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-muted mx-auto flex items-center justify-center">
              <BellOff className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="font-bold text-muted-foreground">لا توجد تنبيهات</p>
            <p className="text-sm text-muted-foreground">أضف تنبيهاً لتعلم فوراً عند تغيّر الأسعار</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-600 dark:text-gold-400 text-sm font-bold hover:bg-gold-500/20 transition-colors"
            ><Plus className="w-4 h-4" />أضف أول تنبيه</button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const currentPrice = getCurrentPrice(alert.karat);
              const isTriggered = alert.notified;
              return (
                <div key={alert.id}
                  className={cn("gold-card p-4 animate-fade-in transition-all", !alert.isActive && "opacity-50", isTriggered && "border-green-500/40 bg-green-500/5")}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", alert.condition === "above" ? "bg-green-500/10" : "bg-red-500/10")}>
                      {isTriggered ? <BellRing className="w-5 h-5 text-green-500" />
                        : alert.condition === "above" ? <TrendingUp className="w-5 h-5 text-green-500" />
                        : <TrendingDown className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{getKaratLabel(alert.karat)}</p>
                        {isTriggered && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">تم التفعيل</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.condition === "above" ? "عند الوصول إلى" : "عند الانخفاض إلى"}{" "}
                        <strong className="text-foreground">{formatPrice(alert.targetPrice)} ج.م</strong>
                      </p>
                      {currentPrice && <p className="text-xs text-muted-foreground mt-0.5">الحالي: {formatPrice(currentPrice)} ج.م</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggle(alert.id, alert.isActive)}
                        aria-label={alert.isActive ? "تعطيل التنبيه" : "تفعيل التنبيه"}
                        className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-colors", alert.isActive ? "bg-gold-500/10 text-gold-600 dark:text-gold-400" : "bg-muted text-muted-foreground")}
                      >{alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}</button>
                      <button onClick={() => handleDelete(alert.id)}
                        aria-label="حذف التنبيه"
                        className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      ><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* History List */}
      {activeTab === "history" && (
        historyLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-gold-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">جاري التحميل...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-muted mx-auto flex items-center justify-center">
              <Clock className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="font-bold text-muted-foreground">لا يوجد سجل</p>
            <p className="text-sm text-muted-foreground">سيظهر سجل التنبيهات التي تم تفعيلها هنا</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div
                key={entry.id}
                className="gold-card p-4 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    entry.condition === "above" ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {entry.condition === "above"
                      ? <TrendingUp className="w-5 h-5 text-green-500" />
                      : <TrendingDown className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{getKaratLabelForHistory(entry.karat)}</p>
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        entry.condition === "above"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {entry.condition === "above" ? "ارتفاع" : "انخفاض"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      المستهدف: <strong className="text-foreground">{formatPrice(entry.targetPrice)} ج.م</strong>
                      {" "} | الحالي: <strong className="text-foreground">{formatPrice(entry.currentPrice)} ج.م</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{getTimeAgo(entry.triggeredAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
