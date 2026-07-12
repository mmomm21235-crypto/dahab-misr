"use client";

import { useState, useEffect } from "react";
import { Download, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("pwa_install_dismissed")) return;

    const ua = navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iOS);

    if (iOS) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    const d = (window as any).__deferredPrompt;
    if (d) { setDeferredPrompt(d); setTimeout(() => setShowPrompt(true), 2000); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) return;
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPrompt(false);
    } catch {}
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className={cn(
      "fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-72 lg:w-80 z-50",
      isIOS ? "animate-slide-in" : "animate-slide-in"
    )}>
      <div className="gold-card p-4 shadow-2xl shadow-black/20 border border-gold-500/30">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white font-black text-lg">ذ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">ثبّت تطبيق ذهب مصر</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "اضغط على زر المشاركة 🡕 ثم اختر 'إضافة للشاشة الرئيسية'"
                : "احصل على تجربة أسرع وإشعارات فورية"}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          disabled={isIOS}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-xl transition-all duration-200",
            isIOS
              ? "bg-muted text-muted-foreground cursor-default"
              : "bg-gold-gradient text-white shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isIOS ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {isIOS ? "شرح التثبيت على آيفون" : "تثبيت التطبيق مجاناً"}
        </button>
      </div>
    </div>
  );
}
