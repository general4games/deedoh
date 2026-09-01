# Tests

الواجهة الحالية تعمل بدون build system أو dependencies خارجية.

الاختبارات المقترحة قبل إضافة CI:

- التحقق من `version.json`.
- التحقق من JSON الخاص بالـ manifest.
- التحقق من وجود جميع `CORE_ASSETS`.
- التحقق من أن كل مسار في `config.js` موجود فعليًا.
- اختبار validation الخاص بالإعدادات.
- اختبار parsing للـ firmware.
