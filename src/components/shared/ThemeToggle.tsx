"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const label = resolvedTheme === "dark" ? "الوضع الفاتح" : "الوضع الليلي";

  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center",
        "bg-muted hover:bg-accent transition-all duration-200",
        "text-muted-foreground hover:text-foreground"
      )}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
