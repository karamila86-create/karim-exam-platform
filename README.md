# Karim Exam Automation Platform

## الخطوات:

1. اعمل مشروع Supabase وشغّل `schema.sql`.
2. انسخ `.env.example` إلى `.env` واملأ فيه URL و anon key بتوع Supabase.
3. شغّل `seed_data.sql` (بعد ما تعدّل رقم موبايلك ورقم امتحان حقيقي) عشان تجرب بسرعة.
4. `npm install` ثم `npm run dev` للتجربة محليًا.

## تثبيت المنصة كتطبيق على الموبايل (PWA)

المنصة دلوقتي قابلة للتثبيت زي أي app عادي (الطالب يفتح الرابط من كروم/سفاري
ويختار "إضافة إلى الشاشة الرئيسية"). الحاجة الوحيدة الناقصة: أيقونتين
(192x192 و512x512 بكسل) في `public/icons/`. لو معندكش لوجو جاهز، قولي
وهجهزلك أيقونة بسيطة.

## الرفع على GitHub ثم Bolt.new

```bash
git init
git add .
git commit -m "Initial commit - exam platform MVP"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

بعد كده في Bolt.new: اضغط أيقونة GitHub تحت الشات → Import from URL → الصق رابط الريبو.
