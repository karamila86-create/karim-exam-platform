/*
# Initial schema for Karim Exam Platform (with approvals)

1. New Tables
- `students` — student accounts. Includes `is_approved` (boolean, default false) so the
  teacher must approve a newly-registered student before they can log in.
- `lessons` — video/resource links per grade.
- `exams` — exams tied to a lesson, with duration and pass score.
- `questions` — MCQ / true-false / essay questions per exam.
- `exam_attempts` — one attempt per student per exam; auto-graded via trigger.
- `student_answers` — per-question answers for an attempt.
2. Functions / Triggers
- `grade_exam_attempt(p_attempt_id)` — auto-grades MCQ/true-false answers and updates the attempt score.
- `trigger_auto_grade()` — fires `grade_exam_attempt` when an attempt's status becomes 'submitted'.
- Trigger `on_exam_submitted` on `exam_attempts` AFTER UPDATE.
3. Security
- RLS enabled on all tables.
- This is a no-auth single-tenant app (login by phone number, not Supabase Auth), so policies
  use `TO anon, authenticated` with `USING (true)` because the data is intentionally shared.
- `students` gets SELECT + INSERT + UPDATE policies (UPDATE needed for the approvals flow).
- `exam_attempts` gets SELECT + INSERT + UPDATE.
- `student_answers` gets SELECT + INSERT.
4. Important Notes
- `is_approved` defaults to false. The Login page checks this flag and blocks unapproved students.
- The Admin page Approvals tab lists students where `is_approved = false` and lets the teacher
  approve (set true) or reject (delete the row) each one.
*/

-- -----------------------------------------------------
-- 1) students
-- -----------------------------------------------------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique not null,
  parent_phone text not null,
  parent_telegram_chat_id text,
  grade_level text,
  is_approved boolean not null default false,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 2) lessons
-- -----------------------------------------------------
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text,
  resource_urls jsonb default '[]',
  grade_level text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 3) exams
-- -----------------------------------------------------
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  duration_minutes int not null default 30,
  pass_score numeric default 50,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- -----------------------------------------------------
-- 4) questions
-- -----------------------------------------------------
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'mcq',
  options jsonb,
  correct_answer text,
  points numeric default 1,
  order_index int default 0
);

-- -----------------------------------------------------
-- 5) exam_attempts
-- -----------------------------------------------------
create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  score numeric,
  max_score numeric,
  status text default 'in_progress',
  unique(exam_id, student_id)
);

-- -----------------------------------------------------
-- 6) student_answers
-- -----------------------------------------------------
create table if not exists student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references exam_attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_awarded numeric default 0
);

-- =====================================================
-- Auto-grading function + trigger
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

create or replace function trigger_auto_grade()
returns trigger as $$
begin
  if new.status = 'submitted' and old.status != 'submitted' then
    perform grade_exam_attempt(new.id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_exam_submitted on exam_attempts;
create trigger on_exam_submitted
after update on exam_attempts
for each row execute function trigger_auto_grade();

-- =====================================================
-- RLS
-- =====================================================
alter table students enable row level security;
alter table lessons enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table exam_attempts enable row level security;
alter table student_answers enable row level security;

-- students: select, insert (register), update (approvals)
drop policy if exists "public read students" on students;
create policy "public read students" on students for select
  to anon, authenticated using (true);

drop policy if exists "public insert students" on students;
create policy "public insert students" on students for insert
  to anon, authenticated with check (true);

drop policy if exists "public update students" on students;
create policy "public update students" on students for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "public delete students" on students;
create policy "public delete students" on students for delete
  to anon, authenticated using (true);

-- lessons
drop policy if exists "public read lessons" on lessons;
create policy "public read lessons" on lessons for select
  to anon, authenticated using (true);

-- exams
drop policy if exists "public read exams" on exams;
create policy "public read exams" on exams for select
  to anon, authenticated using (true);

-- questions
drop policy if exists "public read questions" on questions;
create policy "public read questions" on questions for select
  to anon, authenticated using (true);

-- exam_attempts
drop policy if exists "public read attempts" on exam_attempts;
create policy "public read attempts" on exam_attempts for select
  to anon, authenticated using (true);

drop policy if exists "public insert attempts" on exam_attempts;
create policy "public insert attempts" on exam_attempts for insert
  to anon, authenticated with check (true);

drop policy if exists "public update attempts" on exam_attempts;
create policy "public update attempts" on exam_attempts for update
  to anon, authenticated using (true) with check (true);

-- student_answers
drop policy if exists "public read answers" on student_answers;
create policy "public read answers" on student_answers for select
  to anon, authenticated using (true);

drop policy if exists "public insert answers" on student_answers;
create policy "public insert answers" on student_answers for insert
  to anon, authenticated with check (true);
