"use client";

import { useState, useEffect } from "react";
import { X, Calculator, TrendingUp, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
  {
    icon: Calculator,
    title: "احسب ذهبك",
    desc: "استخدم حاسبة الذهب لمعرفة قيمة ذهبك بالوزن والعيار",
    href: "/calculator",
  },
  {
    icon: Bell,
    title: "تنبيهات الأسعار",
    desc: "اعمل تنبيه للسعر اللي تتابعه واستلم إشعار فوري عند الوصول",
    href: "/alerts",
  },
  {
    icon: TrendingUp,
    title: "تابع الرسوم",
    desc: "شاهد حركة أسعار الذهب خلال يوم، أسبوع، أو سنة",
    href: "/charts",
  },
];

const DISMISS_KEY = "dahab-misr-onboarded";

export function OnboardingTooltip() {
  const [currentTip, setCurrentTip] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) {
        setTimeout(() => setShow(true), 2000);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  };

  const tip = TIPS[currentTip];
  const Icon = tip.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
        >
          <div className="gold-card p-4 shadow-2xl shadow-gold-500/20 border border-gold-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
              <button
                onClick={dismiss}
                className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1.5">
                {TIPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTip ? "bg-gold-500 w-4" : "bg-muted"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentTip < TIPS.length - 1 ? (
                  <button
                    onClick={() => setCurrentTip((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 text-xs font-bold"
                  >
                    التالي
                  </button>
                ) : (
                  <a
                    href={tip.href}
                    onClick={dismiss}
                    className="px-3 py-1.5 rounded-lg bg-gold-gradient text-white text-xs font-bold"
                  >
                    جرّب الآن
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
