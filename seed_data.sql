-- =====================================================
-- بيانات تجريبية للاختبار - عدّل الأرقام والأسماء زي ما تحب
-- شغّلها بعد ما تشغّل schema.sql
-- =====================================================

-- طالب تجريبي (غيّر phone و parent_phone لرقمك الحقيقي عشان تجرب استقبال الإشعار)
insert into students (full_name, phone, parent_phone, grade_level)
values ('محمد أحمد', '01000000001', '01000000002', 'الصف الثالث الثانوي');

-- درس تجريبي
insert into lessons (title, video_url, grade_level)
values ('الحث الكهرومغناطيسي - الحصة الأولى', 'https://youtube.com/watch?v=XXXXXXXX', 'الصف الثالث الثانوي');

-- امتحان تجريبي (5 دقايق بس للاختبار السريع)
insert into exams (title, duration_minutes, pass_score)
values ('اختبار سريع - الحث الكهرومغناطيسي', 5, 50)
returning id;
-- انسخ الـ id اللي هيطلع من السطر اللي فوق واستخدمه في الأسئلة تحت

-- مثال أسئلة (لازم تستبدل 'EXAM_ID_HERE' بالـ id الحقيقي اللي طلع فوق)
insert into questions (exam_id, question_text, question_type, options, correct_answer, points, order_index)
values
  ('EXAM_ID_HERE', 'وحدة قياس الحث الكهرومغناطيسي هي؟', 'mcq', '["هنري", "فاراد", "أوم", "تسلا"]', 'هنري', 1, 1),
  ('EXAM_ID_HERE', 'قانون فاراداي يربط بين الجهد المستحث والتغير في؟', 'mcq', '["التيار", "الفيض المغناطيسي", "المقاومة", "الجهد"]', 'الفيض المغناطيسي', 1, 2),
  ('EXAM_ID_HERE', 'زيادة عدد لفات الملف يزيد من قيمة الحث الذاتي', 'true_false', null, 'صح', 1, 3);
