# تقرير الأمان الشامل — ذهب مصر

## ملخص التنفيذ
- **التاريخ:** 2026-07-12
- **الإصدار:** 2.1.0
- **الحالة:** مُنقَّح بالكامل
- **مدة المراجعة:** شاملة — جميع ملفات API والمكتبات الأساسية

---

## فئات الأمان

### 1. حماية APIs

| المعيار | الحالة | التفاصيل |
|---------|--------|----------|
| Rate Limiting | ✅ مُفعّل | 60 req/min عادي، 5 req/min push، 30 gold prices |
| Authentication | ✅ مُفعّل | Google OAuth عبر NextAuth |
| Authorization | ⚠️ جزئي | Admin-only endpoints تستخدم `requireAdmin` |
| Input Validation | ⚠️ جزئي | بعض routes لا تستخدم `withSecurity` |
| CSRF Protection | ⚠️ جزئي | SameSite cookies عبر NextAuth فقط |
| Response Sanitization | ⚠️ جزئي | لا يوجد sanitization شامل للاستجابات |

#### ثغرات محددة في حماية APIs:

1. **⚠️ `GET /api/alerts/history` — لا يوجد مصادقة**
   - الملف: `src/app/api/alerts/history/route.ts:7-18`
   - لا يستخدم `withSecurity` أو `getSession`
   - أي شخص يمكنه قراءة سجل التنبيهات كاملاً
   - **الخطر:** تسريب بيانات التنبيهات لغير المستخدمين
   - **الحل:** إضافة `getSession()` والتحقق من صلاحية الوصول

2. **⚠️ `POST /api/alerts/history` — لا يوجد مصادقة أو تدقيق**
   - الملف: `src/app/api/alerts/history/route.ts:20-51`
   - لا يوجد `withSecurity` أو تحقق من الهوية
   - يمكن لأي شخص تسجيل تنبيهات مزيفة
   - **الحل:** إضافة `withSecurity` مع `requireAuth: true`

3. **⚠️ `PUT/DELETE /api/portfolio/[id]` — لا يوجد Rate Limiting**
   - الملف: `src/app/api/portfolio/[id]/route.ts:12-65`
   - لا يستخدم `withSecurity` — لا يوجد rate limit أو body validation
   - **الحل:** لفّ الدوال باستخدام `withSecurity`

4. **⚠️ `DELETE /api/shops/[id]` — لا يوجد Rate Limiting**
   - الملف: `src/app/api/shops/[id]/route.ts:5-31`
   - لا يستخدم `withSecurity` — لا يوجد rate limit
   - **الحل:** إضافة `withSecurity` مع `requireAdmin: true`

5. **⚠️ `GET /api/admin/stats` — لا يوجد Rate Limiting**
   - الملف: `src/app/api/admin/stats/route.ts:7-54`
   - يستخدم `requireAdmin` لكن بدون `withSecurity`
   - **الحل:** لفّ الدالة بـ `withSecurity`

6. **⚠️ `GET/POST/DELETE /api/alerts` — لا يوجد Rate Limiting**
   - الملف: `src/app/api/alerts/route.ts`
   - لا يستخدم `withSecurity` — لا يوجد rate limit أو body validation على POST
   - **الحل:** إضافة `withSecurity`

7. **⚠️ Rate Limiting بالذاكرة لا يعمل على Vercel**
   - الملف: `src/lib/rate-limit.ts:1`
   - `Map` في الذاكرة لا تشارك بين instances على serverless
   - **الحل:** استخدام Redis أو Vercel KV للـ rate limiting

---

### 2. حماية البيانات

| المعيار | الحالة | التفاصيل |
|---------|--------|----------|
| Encryption at rest | ⚠️ معيبة | مفتاح التشفير الافتراضي hardcoded في الكود |
| Data masking | ✅ مُفعّل | maskPhone, maskEmail, maskName متاحة |
| Environment variables | ✅ مُفعّل | لا توجد secrets في الكود المصدري (مع ملاحظات) |
| No secrets in client-side | ✅ مُفعّل | VAPID public key هو الم唯一 المُكشف |
| Audit logging | ✅ مُفعّل | alert history يسجل التنبيهات |

#### ثغرات محددة في حماية البيانات:

1. **🔴 مفتاح التشفير الافتراضي hardcoded**
   - الملف: `src/lib/encryption.ts:4-8`
   ```ts
   const KEY = crypto.scryptSync(
     process.env.ENCRYPTION_KEY || "dahab-misr-default-key-change-in-production",
     "salt-dahab-misr", 32
   );
   ```
   - إذا لم يتم تعيين `ENCRYPTION_KEY`، سيتم استخدام مفتاح معروف
   - **الخطر:** أي شخص لديه الوصول للكود يمكنه فك تشفير البيانات
   - **الحل:** إجبار تعيين `ENCRYPTION_KEY` في بيئة الإنتاج وإ抛出 خطأ إذا لم يكن موجوداً

2. **🔴 البريد الإلكتروني لل Admin hardcoded كقيمة افتراضية**
   - الملف: `src/lib/admin.ts:3`
   ```ts
   const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mmomm21235@gmail.com";
   ```
   - **الخطر:** تسريب البريد الإلكتروني للمدير
   - **الحل:** استخدام `process.env.ADMIN_EMAIL` فقط بدون fallback

3. **⚠️ بيانات push subscription مخزنة كنص عادي**
   - الملف: `src/app/api/push/send/route.ts:34`
   - `pushSubscription` مخزنة كـ JSON string في قاعدة البيانات
   - **الحل:** تشفير subscription data قبل التخزين

4. **⚠️ `console.error` قد يسرّب بيانات حساسة**
   - الملفات: جميع ملفات API
   - رسائل الخطأ قد تتضمن معلومات عن المستخدم أو البيانات
   - **الحل:** استخدام logging آمن لا يسرّب بيانات المستخدمين

---

### 3. حماية الكود

| المعيار | الحالة | التفاصيل |
|---------|--------|----------|
| Console protection | ✅ مُفعّل | Watermark في production |
| Right-click disabled | ✅ مُفعّل | في production |
| DevTools detection | ✅ مُفعّل | كشف فتح أدوات المطور |
| iframe clickjacking | ✅ مُفعّل | X-Frame-Options: DENY |
| Ctrl+S, Ctrl+U, F12 | ✅ مُفعّل | معطلة في production |

---

### 4. حماية البنية التحتية

| المعيار | الحالة | الملف |
|---------|--------|-------|
| CSP | ✅ مُعرّف | vercel.json:37-38 |
| HSTS | ✅ مُفعّل | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | ✅ DENY | next.config.ts + vercel.json |
| X-Content-Type-Options | ✅ nosniff | next.config.ts + vercel.json |
| X-XSS-Protection | ✅ 1; mode=block | next.config.ts + vercel.json |
| Referrer-Policy | ✅ strict-origin-when-cross-origin | next.config.ts + vercel.json |
| Permissions-Policy | ✅ محدود | camera, mic, geo, payment, usb disabled |
| Cache-Control | ⚠️ متعارض | `no-store` في next.config + `s-maxage=300` في vercel.json |
| Cross-Origin policies | ⚠️ جزئي | COEP: `unsafe-none` بدلاً من `require-corp` |

#### ثغرات محددة في حماية البنية التحتية:

1. **⚠️ تعارض Cache-Control headers**
   - `next.config.ts:38`: `no-store, no-cache, must-revalidate`
   - `vercel.json:52`: `public, s-maxage=300, stale-while-revalidate=600`
   - **الخطر:** سلوك غير متوقع في التخزين المؤقت
   - **الحل:** توحيد الإعدادات — `no-store` للصفحات، `s-maxage` للـ API فقط

2. **⚠️ CSP يسمح بـ `unsafe-eval` و `unsafe-inline`**
   - الملف: `vercel.json:38`
   - مطلوب بواسطة Next.js لكنه يقلل فعالية CSP
   - **الحل:** تقييد `unsafe-inline` باستخدام nonce حيث أمكن

3. **⚠️ `Cross-Origin-Embedder-Policy: unsafe-none`**
   - الملف: `vercel.json:49-51`
   - **الحل:** استخدام `require-corp` إذا أمكن

4. **⚠️ `X-Cache-Source` header يسرّب تفاصيل التنفيذ**
   - الملف: `src/app/api/gold-prices/route.ts:64`
   - **الحل:** إزالة هذا Header من الاستجابات

---

### 5. حماية المصادقة

| المعيار | الحالة | التفاصيل |
|---------|--------|----------|
| Session expiry | ✅ 30 يوم | `auth.ts:12` |
| Secure cookies | ✅ عبر NextAuth | SameSite, Secure في الإنتاج |
| Admin email verification | ✅ مُفعّل | `admin.ts:5-8` |
| No password storage | ✅ OAuth فقط | لا يوجد تسجيل بكلمة مرور |
| JWT strategy | ✅ مُفعّل | `session.strategy: "jwt"` |

#### ثغرات محددة في المصادقة:

1. **⚠️ Google OAuth credentials قد تكون missing في production**
   - الملف: `src/lib/auth.ts:6-7`
   - `googleId || "missing"` — إذا لم يتم تعيينها، سيء يعمل لكن بدون مصادقة حقيقية
   - **الحل:** التأكد من تعيين المتغيرات البيئية في Vercel

2. **⚠️ `AUTH_SECRET` يعتمد على `NEXTAUTH_SECRET` كبديل**
   - الملف: `src/lib/auth.ts:11`
   - **الحل:** استخدام `AUTH_SECRET` فقط

---

### 6. حماية Offline

| المعيار | الحالة | التفاصيل |
|---------|--------|----------|
| Service Worker | ✅ مُفعّل | `public/sw.js` |
| Network-first (gold prices) | ✅ مُفعّل | 5 min cache fallback |
| Stale-while-revalidate (news) | ✅ مُفعّل | 5 min revalidation |
| Offline fallback | ✅ مُفعّل | صفحة `/offline.html` |
| Cache cleanup | ✅ مُفعّل | حذف الكاش القديم في `activate` |

---

## مخاطر محددة وحلولها

### 1. هجمات DDoS
- **المخاطرة:** حجم كبير من الطلبات
- **الحل:** Rate limiting + Vercel built-in DDoS protection
- **الحالة:** ✅ مُعالَج (مع ملاحظة أن rate limiting بالذاكرة محدود في serverless)

### 2. سرقة البيانات
- **المخاطرة:** اختراق قاعدة البيانات
- **الحل:** تشفير البيانات الحساسة + لا بيانات في logs
- **الحالة:** ⚠️ مُعالَج جزئياً (مفتاح التشفير hardcoded)

### 3. سرقة الكود
- **المخاطرة:** نسخ الكود من العميل
- **الحل:** Minification + Obfuscation + Copyright notices
- **الحالة:** ✅ مُعالَج

### 4. XSS (Cross-Site Scripting)
- **المخاطرة:** حقن أكواد خبيثة
- **الحل:** CSP + Input sanitization + React escaping
- **الحالة:** ✅ مُعالَج

### 5. SQL Injection
- **المخاطرة:** حقن استعلامات SQL
- **الحل:** Prisma ORM (parameterized queries)
- **الحالة:** ✅ مُعالَج

### 6. Man-in-the-Middle
- **المخاطرة:** اعتراض الاتصالات
- **الحل:** HTTPS + HSTS
- **الحالة:** ✅ مُعالَج

### 7. Broken Access Control
- **المخاطرة:** وصول غير مصرح به لبيانات المستخدمين
- **الحل:** التحقق من الهوية والصلاحيات في كل endpoint
- **الحالة:** ⚠️ بعض الـ endpoints لا تتحقق بشكل كامل

### 8. Insecure Deserialization
- **المخاطرة:** تنفيذ كود أثناء تحليل JSON
- **الحل:** Try-catch حول `request.json()` مع validation
- **الحالة:** ✅ مُعالَج

---

## إحصائيات المخاطر

| الفئة | عدد الثغرات | خطيرة | متوسطة | منخفضة |
|-------|------------|--------|---------|--------|
| حماية APIs | 7 | 0 | 5 | 2 |
| حماية البيانات | 4 | 2 | 1 | 1 |
| حماية البنية التحتية | 4 | 0 | 3 | 1 |
| حماية المصادقة | 2 | 0 | 1 | 1 |
| **المجموع** | **17** | **2** | **10** | **5** |

---

## توصيات عاجلة

### أولوية عالية (يجب إصلاحها فوراً):
1. إضافة مصادقة لـ `GET /api/alerts/history`
2. إصلاح مفتاح التشفير الافتراضي hardcoded
3. إزالة البريد الإلكتروني الافتراضي للمدير
4. إضافة `withSecurity` لجميع الـ endpoints المفقودة

### أولوية متوسطة (يجب إصلاحها قريباً):
5. استخدام Redis لـ rate limiting بدل الذاكرة
6. توحيد Cache-Control headers
7. تشفير push subscription data
8. تقييد CSPFurther

### أولوية منخفضة (تحسينات):
9. تحسين COEP policy
10. إزالة headers التي تسرّب التفاصيل التقنية

---

## ملاحظات تقنية

### ملفات مراجعة:
- `src/app/api/gold-prices/route.ts` — ✅ يستخدم `withSecurity`
- `src/app/api/portfolio/route.ts` — ✅ يستخدم `withSecurity`
- `src/app/api/portfolio/[id]/route.ts` — ⚠️ لا يستخدم `withSecurity`
- `src/app/api/shops/route.ts` — ✅ يستخدم `withSecurity`
- `src/app/api/shops/[id]/route.ts` — ⚠️ لا يستخدم `withSecurity`
- `src/app/api/push/send/route.ts` — ✅ يستخدم `withSecurity`
- `src/app/api/alerts/route.ts` — ⚠️ لا يستخدم `withSecurity`
- `src/app/api/alerts/history/route.ts` — ⚠️ لا يستخدم `withSecurity`
- `src/app/api/news/route.ts` — ✅ يستخدم `withSecurity`
- `src/app/api/admin/stats/route.ts` — ⚠️ لا يستخدم `withSecurity`
- `src/lib/auth.ts` — ✅ إعدادات آمنة
- `src/lib/admin.ts` — ⚠️ hardcoded fallback
- `src/lib/push-service.ts` — ✅ إدارة آمنة
- `src/lib/db/prisma.ts` — ✅ singleton pattern
- `src/lib/rate-limit.ts` — ⚠️ memory-based فقط
- `src/lib/validation.ts` — ✅ تدقيق شامل
- `src/lib/encryption.ts` — ⚠️ مفتاح افتراضي hardcoded
- `src/lib/api-security.ts` — ✅ wrapper آمن
- `next.config.ts` — ⚠️ تعارض Cache-Control
- `vercel.json` — ✅ headers آمنة
- `public/sw.js` — ✅ cache strategies صحيحة
