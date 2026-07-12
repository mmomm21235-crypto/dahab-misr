# ذهب مصر 🥇
### تطبيق أسعار الذهب في مصر - لحظي واحترافي

---

## 🗂️ شجرة المشروع الكاملة

```
dahab-misr/
├── public/
│   ├── icons/               # أيقونات PWA بجميع الأحجام
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── manifest.json        # إعدادات PWA
│   ├── sw.js                # Service Worker
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── app/
│   │   ├── (routes)/
│   │   │   ├── calculator/page.tsx
│   │   │   ├── charts/page.tsx
│   │   │   ├── news/
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── gold-prices/route.ts
│   │   │   └── news/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── home/
│   │   │   ├── HomeContent.tsx
│   │   │   ├── GoldPriceCard.tsx
│   │   │   ├── PriceGrid.tsx
│   │   │   ├── LastUpdateBadge.tsx
│   │   │   ├── MiniChart.tsx
│   │   │   └── QuickStats.tsx
│   │   ├── calculator/
│   │   │   └── GoldCalculator.tsx
│   │   ├── charts/
│   │   │   └── ChartsContent.tsx
│   │   ├── news/
│   │   │   ├── NewsContent.tsx
│   │   │   └── NewsDetailContent.tsx
│   │   ├── alerts/
│   │   │   └── AlertsContent.tsx
│   │   ├── settings/
│   │   │   └── SettingsContent.tsx
│   │   └── shared/
│   │       ├── SkeletonCard.tsx
│   │       ├── InstallPrompt.tsx
│   │       └── ThemeToggle.tsx
│   ├── context/
│   │   ├── ThemeContext.tsx
│   │   └── GoldContext.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── goldData.ts
│   │   └── storage.ts
│   └── types/
│       └── index.ts
├── .env.local
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚡ أوامر التثبيت

```bash
# 1. استنساخ أو إنشاء المشروع
mkdir dahab-misr && cd dahab-misr

# 2. تثبيت الحزم
npm install

# 3. تثبيت مكونات shadcn/ui (اختياري - للمكونات الإضافية)
npx shadcn@latest init
```

---

## 🚀 أوامر التشغيل

```bash
# تشغيل بيئة التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل نسخة الإنتاج محلياً
npm run start

# فحص الأخطاء
npm run lint
```

التطبيق يعمل على: **http://localhost:3000**

---

## 📤 أوامر النشر على GitHub

```bash
# 1. تهيئة git
git init
git add .
git commit -m "🥇 Initial commit: ذهب مصر PWA"

# 2. إنشاء مستودع على GitHub ثم:
git remote add origin https://github.com/USERNAME/dahab-misr.git
git branch -M main
git push -u origin main
```

---

## 🌐 النشر على Vercel

### الطريقة الأولى: عبر الموقع
1. اذهب إلى **https://vercel.com/new**
2. اختر **"Import Git Repository"**
3. اختر مستودع `dahab-misr`
4. اترك الإعدادات الافتراضية (يكتشف Next.js تلقائياً)
5. اضغط **Deploy**

### الطريقة الثانية: عبر CLI
```bash
# تثبيت Vercel CLI
npm install -g vercel

# نشر
vercel

# نشر للإنتاج
vercel --prod
```

### متغيرات البيئة على Vercel
في لوحة تحكم Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_APP_URL = https://dahab-misr.vercel.app
NEXT_PUBLIC_APP_NAME = ذهب مصر
```

---

## 📱 تحويله إلى تطبيق PWA

### على Android:
1. افتح المتصفح (Chrome) وادخل على الموقع
2. ستظهر رسالة **"إضافة إلى الشاشة الرئيسية"** تلقائياً
3. أو من قائمة المتصفح ← **تثبيت التطبيق**
4. سيعمل كتطبيق مستقل بدون شريط المتصفح

### على iPhone (Safari):
1. افتح Safari وادخل على الموقع
2. اضغط زر **المشاركة** (⬆️)
3. اختر **"إضافة إلى الشاشة الرئيسية"**
4. اضغط **إضافة**

### نشره كـ APK على Google Play (اختياري):
```bash
# استخدام Bubblewrap
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://dahab-misr.vercel.app/manifest.json
bubblewrap build
# سيُنشئ ملف APK في مجلد app/
```

---

## 🔧 إضافة API حقيقي لأسعار الذهب

في `src/context/GoldContext.tsx` و `src/app/api/gold-prices/route.ts`، استبدل `generateCurrentPrices()` بـ:

```typescript
// مثال: استخدام goldapi.io
const response = await fetch("https://www.goldapi.io/api/XAU/EGP", {
  headers: { "x-access-token": process.env.GOLD_API_KEY! }
});
const data = await response.json();
```

مصادر API مجانية:
- **https://www.goldapi.io/** - مجاني حتى 100 طلب/شهر
- **https://metals-api.com/** - مجاني حتى 50 طلب/شهر
- **سكرابينج محلي** من مواقع مصرية

---

## 🎨 التخصيص

### تغيير الألوان
في `tailwind.config.ts`:
```typescript
gold: {
  500: "#f59e0b",  // اللون الرئيسي
  // غيّر حسب تفضيلك
}
```

### إضافة لغة جديدة
في `src/types/index.ts`:
```typescript
language: "ar" | "en" | "fr";
```

---

## 📊 التقنيات المستخدمة

| التقنية | الغرض |
|---------|--------|
| Next.js 15 | الإطار الرئيسي |
| TypeScript | الأمان والنوعية |
| Tailwind CSS | التصميم |
| Recharts | الرسوم البيانية |
| Sonner | الإشعارات |
| PWA | تثبيت كتطبيق |
| localStorage | حفظ البيانات محلياً |

---

## 📝 ملاحظات مهمة

- **الأسعار محاكاة**: الأسعار الحالية محاكاة للتطوير. استبدلها بـ API حقيقي للإنتاج
- **RTL كامل**: التطبيق مصمم بالكامل للعربية من اليمين لليسار
- **مجاني 100%**: GitHub + Vercel = استضافة مجانية كاملة
- **Offline Support**: يعمل بدون إنترنت بفضل Service Worker
