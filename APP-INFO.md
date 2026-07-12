# تفاصيل تطبيق "ذهب مصر" - Dahab Misr

## معلومات عامة
- **الاسم:** ذهب مصر (Dahab Misr)
- **الإصدار:** 2.1.0
- **URL:** https://dahab-misr.vercel.app
- **الغة:** العربية (RTL)
- **النوع:** PWA + Android App (Capacitor)

## التقنيات
- **Framework:** Next.js 16.2.9 (App Router, Turbopack)
- **React:** 19.0.0
- **TypeScript:** 5.7.2
- **CSS:** Tailwind CSS 3.4.17
- **Database:** SQLite (dev) / Neon PostgreSQL (prod)
- **ORM:** Prisma 5.22.0
- **Auth:** NextAuth.js 4.24.14 (Google OAuth)
- **State:** Zustand 5.0.14
- **Charts:** Recharts 2.15.0
- **Animations:** Framer Motion 11.15.0
- **PWA:** Service Worker + Manifest
- **Push Notifications:** Web Push API (VAPID)
- **OG Images:** @vercel/og (Edge Runtime)
- **Analytics:** Google Analytics (G-MD53RY84YW)
- **Mobile:** Capacitor 8.4.1 (Android)
- **Hosting:** Vercel (iad1 build, fra1 runtime)
- **Database Host:** Neon PostgreSQL

## الصفحات
| Route | الوصف |
|---|---|
| `/` | الصفحة الرئيسية - أسعار الذهب + أخبار حقيقية |
| `/calculator` | حاسبة الذهب المتقدمة (4 عيارات + حاسبة الاستثمار + تحويل USD) |
| `/charts` | الرسوم البيانية التفاعلية (6 فترات) |
| `/news` | أخبار حقيقية من NewsData.io |
| `/alerts` | تنبيهات ذكية (سعر + نسبة تغيّر) |
| `/portfolio` | محفظتي - تتبع الاستثمارات |
| `/shops` | دليل محلات الذهب |
| `/settings` | الإعدادات |
| `/about` | عن التطبيق |
| `/privacy` | سياسة الخصوصية |
| `/terms` | شروط الاستخدام |
| `/advertise` | أعلن معنا |
| `/admin` | لوحة تحكم الأدمن |

## APIs
| Route | Method | الوصف |
|---|---|---|
| `/api/gold-prices` | GET | أسعار الذهب الحية |
| `/api/gold-prices/history` | GET | تاريخ الأسعار |
| `/api/news` | GET | أخبار من NewsData.io |
| `/api/og` | GET | صور OG ديناميكية |
| `/api/portfolio` | GET/POST | المحفظة (إضافة/عرض) |
| `/api/portfolio/[id]` | PUT/DELETE | تعديل/حذف صنف |
| `/api/shops` | GET/POST | محلات (قراءة/إضافة) |
| `/api/shops/[id]` | DELETE | حذف محل |
| `/api/shops-admin` | GET | إدارة المحلات |
| `/api/alerts` | GET/POST/DELETE | تنبيهات |
| `/api/push/subscribe` | GET | اشتراك الإشعارات |
| `/api/push/unsubscribe` | POST | إلغاء الاشتراك |
| `/api/push/send` | POST | إرسال إشعار |
| `/api/status` | GET | حالة النظام |

## Database Models
- **User** - حسابات المستخدمين (NextAuth)
- **Account** - حسابات OAuth
- **Session** - جلسات المستخدمين
- **UserSettings** - إعدادات المستخدم
- **Alert** - تنبيهات الأسعار
- **GoldPrice** - تاريخ أسعار الذهب
- **Shop** - محلات الذهب
- **NewsArticle** - الأخبار
- **PortfolioHolding** - استثمارات المستخدم

## الملفات المهمة
- `src/app/layout.tsx` - Root layout (OG + JSON-LD)
- `src/app/sitemap.ts` - خريطة الموقع الديناميكية
- `src/app/api/og/route.tsx` - صور OG ديناميكية
- `src/components/home/` - مكونات الصفحة الرئيسية
- `src/components/layout/` - مكونات التخطيط (Sidebar + BottomNav)
- `src/components/portfolio/` - مكونات المحفظة
- `src/components/shared/ShareModal.tsx` - نافذة المشاركة
- `src/lib/` - الخدمات والأدوات
- `src/stores/` - Zustand stores
- `src/context/` - React Context
- `prisma/schema.postgres.prisma` - قاعدة البيانات (PostgreSQL)
- `capacitor.config.json` - إعدادات Capacitor
- `android/` - مشروع Android
- `.github/workflows/build-android.yml` - بناء APK تلقائي

## المراحل المكتملة

### المرحلة 1: CSS + UI ✅
- [x] إزالة CSS مكرر وميت
- [x] إضافة staggered fade-in
- [x] تقليل BottomNav لـ 5 عناصر
- [x] تكبير touch targets لـ 44px
- [x] إضافة aria-label
- [x] إضافة prefers-reduced-motion

### المرحلة 2: ميزات ✅
- [x] أخبار حقيقية (NewsData.io)
- [x] حاسبة ذهب متقدمة (USD + حاسبة الاستثمار)
- [x] محفظتي (Portfolio Tracker)
- [x] تنبيهات ذكية (نسبة تغيّر)
- [x] مشاركة مخصصة (WhatsApp/Facebook/Twitter/Telegram)

### المرحلة 3: أداء ✅
- [x] Loading states للصفحات

### المرحلة 4: SEO ✅
- [x] Dynamic sitemap
- [x] OG images ديناميكية

### المرحلة 5: موبايل ✅
- [x] Capacitor setup
- [x] Android project
- [x] GitHub Actions workflow للبناء التلقائي
- [x] Push notifications plugin

## بناء APK

### تلقائي (GitHub Actions)
1. ادفع الكود لـ main
2. GitHub Actions سيبني الـ APK تلقائياً
3. حمّل الـ APK من Actions → Artifacts

### يدوي (محلي)
يجب تثبيت:
- Java JDK 17+
- Android SDK
- Gradle

```bash
npm run android:sync
npm run android:build
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---
**آخر تحديث:** 2026-07-10
