# منصة أمان

- الصفحة الرئيسية: https://aman-platform.almaloumatiya.workers.dev/
- تطبيق الزبون: https://aman-platform.almaloumatiya.workers.dev/app/
- تطبيق الإدارة: https://aman-platform.almaloumatiya.workers.dev/admin/

شغّالة على Cloudflare Workers (الخطة المجانية) مع قاعدة بيانات D1 (`aman-platform-db`).
رمز دخول الإدارة محفوظ كـ secret اسمو `ADMIN_KEY` على الـ Worker، ومش موجود بالكود.

## النشر
```
node _build.js          # بيجمع ملفات public و الـ API بملف واحد worker/index.js
cd worker && npx wrangler deploy
```
لتغيير رمز الإدارة: `npx wrangler secret put ADMIN_KEY` من مجلد worker.
