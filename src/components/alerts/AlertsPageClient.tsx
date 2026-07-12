"use client";

import { useState, useEffect } from "react";
import { AlertsContent } from "@/components/alerts/AlertsContent";

export function AlertsPageClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full" />
    </div>
  );
  return <AlertsContent />;
}
