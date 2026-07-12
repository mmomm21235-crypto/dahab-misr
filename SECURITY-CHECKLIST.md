# قائمة تأمين الأمان — رصد دوري

## قبل كل deployment:
- [ ] لا توجد secrets في الكود المصدري
- [ ] `.env` غير موجود في git (تأكد من `.gitignore`)
- [ ] `ENCRYPTION_KEY` مُعيَّن في بيئة الإنتاج
- [ ] `ADMIN_EMAIL` مُعيَّن في بيئة الإنتاج
- [ ] `AUTH_SECRET` مُعيَّن في بيئة الإنتاج
- [ ] `AUTH_GOOGLE_ID` و `AUTH_GOOGLE_SECRET` مُعيَّنان
- [ ] Rate limiting شغال (افتح Console وتحقق من 429 errors)
- [ ] CSP headers محدثة في `vercel.json`
- [ ] All endpoints يستخدمون `withSecurity` wrapper
- [ ] `.env.example` موجود بدون قيم حقيقية
- [ ] `npm audit` لا يوجد ثغرات حرجة (high/critical)

## شهرياً:
- [ ] مراجعة `SECURITY-AUDIT.md` للتحديثات
- [ ] تشغيل `npm audit` وتحديث التبعيات المتأخرة
- [ ] فحص logs للنشاط المشبوه (Vercel Dashboard)
- [ ] اختبار Backup وعملية الاستعادة
- [ ] مراجعة Admin access log
- [ ] فحص Rate limiting stats
- [ ] اختبار Push notification functionality
- [ ] مراجعة Prisma schema لا توجد حقول جديدة غير مشفرة
- [ ] تحديث CSP إذا أضفت domains جديدة
- [ ] فحص `console.error` logs لا تسرّب بيانات حساسة

## عند اكتشاف ثغرة:
- [ ] تسجيل الثغرة (file, line, severity)
- [ ] تقييم الخطورة (Critical / High / Medium / Low)
- [ ] إبلاغ الفريق المعني
- [ ] إصلاح فوري للثغرات الحرجة
- [ ] اختبار الإصلاح في بيئة staging
- [ ] نشر الإصلاح
- [ ] تقرير بعد الحادثة (post-mortem)
- [ ] تحديث هذا القائمة إذا لزم الأمر

## رصد أمني مستمر:
- [ ] مراقبة Vercel Analytics لطلبات غير عادية
- [ ] مراقبة Database performance
- [ ] فحص uptime للـ APIs
- [ ] مراجعة دورية لـ `next.config.ts` headers
- [ ] مراجعة دورية لـ `vercel.json` headers
- [ ] فحص SW cache size periodically

## إجراءات الطوارئ:
1. **اختراق قاعدة البيانات:** تعطيل التطبيق فوراً → تغيير كل Secrets → استعادة من Backup
2. **ثغرة XSS:** نشر إصلاح CSP → تنظيف أي 데이터 ملوثة
3. **DDoS Attack:** الاعتماد على Vercel DDoS protection → تعطيل API المتأثرة مؤقتاً
4. **اختراق Admin:** تغيير ADMIN_EMAIL → مراجعة كل التغييرات → إزالة الوصول المخترق
