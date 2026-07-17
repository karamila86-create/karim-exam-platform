-- =====================================================
-- منصة كريم التعليمية - Database Schema (نسخة مبسطة)
-- مصممة لمعلم واحد (مش نظام يُباع لعملاء متعددين)
-- Sprint 0 - محدّث
-- =====================================================
-- طريقة الاستخدام:
-- 1. افتح مشروع Supabase بتاعك
-- 2. روح على SQL Editor
-- 3. الصق الكود ده كامل واعمل Run
-- =====================================================

-- -----------------------------------------------------
-- 1) جدول الطلبة
-- -----------------------------------------------------
create table students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique not null,         -- رقم الطالب (بيستخدمه في تسجيل الدخول)
  parent_phone text not null,         -- رقم ولي الأمر (ده اللي هيبعتله n8n النتيجة)
  parent_telegram_chat_id text,       -- لو هتستخدم بوت التليجرام بتاعك
  grade_level text,                   -- الصف الدراسي
  auth_user_id uuid references auth.users(id), -- لو عملت تسجيل دخول حقيقي لاحقًا
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 2) جدول الفيديوهات (روابط يوتيوب / روابط عامة)
-- -----------------------------------------------------
create table lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text,                     -- رابط يوتيوب unlisted
  resource_urls jsonb default '[]',   -- روابط إضافية (PDF, مواقع, إلخ) كـ array
  grade_level text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 3) جدول الامتحانات
-- -----------------------------------------------------
create table exams (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  duration_minutes int not null default 30,  -- مدة الامتحان بالدقايق (التايمر)
  pass_score numeric default 50,             -- درجة النجاح %
  is_active boolean default true,
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 4) جدول الأسئلة
-- -----------------------------------------------------
create table questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'mcq',  -- 'mcq' أو 'true_false' أو 'essay'
  options jsonb,               -- مثال: ["A", "B", "C", "D"]
  correct_answer text,         -- للتصحيح التلقائي (فاضي لو essay)
  points numeric default 1,
  order_index int default 0
);

-- -----------------------------------------------------
-- 5) جدول محاولات الامتحان (submission واحدة لكل طالب لكل امتحان)
-- -----------------------------------------------------
create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  score numeric,                       -- الدرجة النهائية بعد التصحيح التلقائي
  max_score numeric,
  status text default 'in_progress',   -- in_progress | submitted | graded | notified
  unique(exam_id, student_id)          -- محاولة واحدة بس لكل طالب
);

-- -----------------------------------------------------
-- 6) جدول إجابات الطالب
-- -----------------------------------------------------
create table student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,          -- يتحسب تلقائي عند التسليم (MCQ/True-False)
  points_awarded numeric default 0
);

-- =====================================================
-- Auto-grading Function
-- بتشتغل تلقائي وقت ما الطالب يسلم الامتحان
-- بتحسب الدرجة للأسئلة اللي من نوع mcq/true_false
-- =====================================================
create or replace function grade_exam_attempt(p_attempt_id uuid)
returns void as $$
declare
  v_total_score numeric := 0;
  v_max_score numeric := 0;
begin
  update student_answers sa
  set
    is_correct = (sa.answer_text = q.correct_answer),
    points_awarded = case when sa.answer_text = q.correct_answer then q.points else 0 end
  from questions q
  where sa.question_id = q.id
    and sa.attempt_id = p_attempt_id
    and q.question_type in ('mcq', 'true_false');

  select coalesce(sum(sa.points_awarded), 0), coalesce(sum(q.points), 0)
  into v_total_score, v_max_score
  from student_answers sa
  join questions q on q.id = sa.question_id
  where sa.attempt_id = p_attempt_id;

  update exam_attempts
  set score = v_total_score,
      max_score = v_max_score,
      status = 'graded',
      submitted_at = coalesce(submitted_at, now())
  where id = p_attempt_id;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Trigger: لما status يتغير لـ 'submitted' يتصحح تلقائي
-- =====================================================
create or replace function trigger_auto_grade()
returns trigger as $$
begin
  if new.status = 'submitted' and old.status != 'submitted' then
    perform grade_exam_attempt(new.id);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_exam_submitted
after update on exam_attempts
for each row execute function trigger_auto_grade();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
alter table students enable row level security;
alter table lessons enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table exam_attempts enable row level security;
alter table student_answers enable row level security;

-- ملحوظة: تسجيل الدخول دلوقتي برقم الموبايل مباشرة (مش auth.users)،
-- فهنسمح بقراءة/كتابة عامة على مستوى MVP. لما نضيف نظام تسجيل دخول
-- حقيقي (Supabase Auth) هنضيّق الصلاحيات دي.
create policy "public read students" on students for select using (true);
create policy "public read lessons" on lessons for select using (true);
create policy "public read exams" on exams for select using (true);
create policy "public read questions" on questions for select using (true);
create policy "public read attempts" on exam_attempts for select using (true);
create policy "public insert attempts" on exam_attempts for insert with check (true);
create policy "public update attempts" on exam_attempts for update using (true);
create policy "public insert answers" on student_answers for insert with check (true);

-- =====================================================
-- Webhook trigger point لـ n8n
-- =====================================================
-- في Supabase Dashboard > Database > Webhooks:
-- اعمل webhook على event: UPDATE على جدول exam_attempts
-- Condition: status = 'graded'
-- ده اللي هيشغل n8n workflow ويبعت النتيجة لولي الأمر
