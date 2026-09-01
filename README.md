# G2 — General Gaming Shop Offline UI

نسخة Refactor لواجهة المشروع الحالية مع فصل الواجهة عن منطق الحالة والتخزين والصوت والكاش.

## أهم التحسينات

- فصل HTML/CSS/JavaScript.
- توحيد إعدادات المتجر والمسارات في `js/config.js`.
- تخزين الإعدادات مع validation بدل دمج JSON عشوائي.
- Service Worker مسؤول عن Cache Storage بدل إدارة الكاش من الواجهة.
- حذف fallback العام إلى `index.html` لملفات JS/CSS والصور؛ fallback يستخدم للتنقل فقط.
- منع duplicate audio initialization.
- إصلاح مؤقت Toast المتداخل.
- حد أقصى للسجل: 200 عنصر.
- دعم Escape وfocus management للـ modal.
- استخدام `role="switch"` مع `aria-checked`.
- إزالة inline event handlers من الواجهة.
- إضافة `rel="noopener noreferrer"` للروابط الخارجية.
- إضافة `prefers-reduced-motion`.
- إضافة `version.json` لعرض نسخة التطبيق.
- الاحتفاظ بمجلدات المسارات الحالية دون إعادة كتابة ملفاتها.

## بنية المشروع

```text
G2/
├── index.html
├── sw.js
├── manifest.webmanifest
├── version.json
├── shop-logo.png
├── song.mp3
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── audio.js
│   ├── cache-manager.js
│   ├── config.js
│   ├── firmware.js
│   ├── state.js
│   ├── storage.js
│   └── ui.js
├── 505_960/
├── 1000_1102/
└── 1150-1300/
```

## التشغيل

يجب تشغيل المشروع من HTTPS أو localhost حتى يعمل Service Worker.

لا تفتح `index.html` مباشرة عبر `file://`.

## تحديث النسخة

عند تغيير نسخة التطبيق، حدّث:

- `version.json`
- `CACHE_NAME` في `sw.js`
- `RUNTIME_CACHE` في `sw.js`

واجعل رقم النسخة متطابقًا في الثلاثة.

## ملاحظة

هذه الحزمة تعيد تنظيم طبقة التطبيق والـ PWA فقط. ضع مجلدات المشروع الأصلية الخاصة بكل مسار (`505_960`, `1000_1102`, `1150-1300`) بجانب الملفات الجديدة كما هي.
