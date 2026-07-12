import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import Providers from "@/components/shared/Providers";
import arMessages from "@/messages/ar.json";

export const metadata: Metadata = {
  title: {
    default: "ذهب مصر - أسعار الذهب اليوم",
    template: "%s | ذهب مصر",
  },
  description:
    "تابع أسعار الذهب في مصر لحظة بلحظة - عيار 24، 21، 18 والجنيه الذهب. احسب قيمة ذهبك واستلم تنبيهات فورية عند تغير الأسعار.",
  keywords: [
    "أسعار الذهب",
    "سعر الذهب اليوم",
    "ذهب مصر",
    "عيار 21",
    "عيار 24",
    "الجنيه الذهب",
    "سعر الذهب في مصر",
  ],
  authors: [{ name: "ذهب مصر" }],
  creator: "ذهب مصر",
  publisher: "ذهب مصر",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ذهب مصر",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://dahab-misr.vercel.app",
    title: "ذهب مصر - أسعار الذهب اليوم",
    description: "تابع أسعار الذهب في مصر لحظة بلحظة",
    siteName: "ذهب مصر",
    images: [
      {
        url: "/api/og?title=ذهب+مصر&subtitle=أسعار+الذهب+لحظة+بلحظة&type=default",
        width: 1200,
        height: 630,
        alt: "ذهب مصر - أسعار الذهب اليوم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ذهب مصر - أسعار الذهب اليوم",
    description: "تابع أسعار الذهب في مصر لحظة بلحظة",
    images: ["/api/og?title=ذهب+مصر&subtitle=أسعار+الذهب+لحظة+بلحظة&type=default"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  metadataBase: new URL("https://dahab-misr.vercel.app"),
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "ذهب مصر - أسعار الذهب",
      url: "https://dahab-misr.vercel.app",
      description: "تابع أسعار الذهب في مصر لحظة بلحظة - عيار 24، 21، 18 والجنيه الذهب",
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
      },
      author: {
        "@type": "Organization",
        name: "ذهب مصر",
      },
      inLanguage: "ar",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ذهب مصر",
      url: "https://dahab-misr.vercel.app",
      description: "تطبيق لمتابعة أسعار الذهب في مصر لحظة بلحظة",
    },
  ];

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet" />
        <link rel="preload" as="image" href="/icons/icon-192x192.png" />
        <link rel="preload" as="fetch" href="/api/gold-prices" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="google-site-verification" content="googlee9ab5896b100ea68" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/<\//g, "<\\/"),
          }}
        />
      </head>
      <body className="font-arabic antialiased">
        <Providers locale="ar" messages={arMessages}>
          <ErrorBoundary>
            <AppShell>{children}</AppShell>
          </ErrorBoundary>
        </Providers>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MD53RY84YW"
          strategy="afterInteractive"
        />
        <Script id="ga-config" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-MD53RY84YW');`}
        </Script>
        <Script id="install-prompt" strategy="afterInteractive">
          {`window.__deferredPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__deferredPrompt=e;});`}
        </Script>
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`}
        </Script>
        <Script id="security-init" strategy="afterInteractive">
          {`if('${process.env.NODE_ENV}'==='production'){document.addEventListener('contextmenu',function(e){e.preventDefault()});document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.key==='s'||e.ctrlKey&&e.key==='u'||e.ctrlKey&&e.shiftKey&&e.key==='I'||e.key==='F12'){e.preventDefault();return false;}});if(window.top!==window.self){window.top.location=window.self.location;}}`}
        </Script>
      </body>
    </html>
  );
}
