"use client";

import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { PageTransition } from "@/components/shared/PageTransition";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { OnboardingTooltip } from "@/components/shared/OnboardingTooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        تخطى إلى المحتوى الرئيسي
      </a>
      <Sidebar />
      <div className="main-content">
        <Header />
        <main
          id="main-content"
          className="px-4 py-4 lg:px-8 lg:py-6 max-w-4xl mx-auto"
        >
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
      <OnboardingTooltip />
    </div>
  );
}
