/*
# Add image support for questions + fix missing CRUD policies

1. Modified Tables
- `questions`
  - `question_image_url` (text, nullable) — public URL of an optional image attached to the question text.
2. Storage
- Create public bucket `question-images` for uploading question and option images.
- Policies: public read, public upload, public delete (anon + authenticated).
3. Security — missing CRUD policies (fixes silently-broken admin create/delete)
- `lessons`: add INSERT, UPDATE, DELETE (previously only SELECT existed).
- `exams`: add INSERT, UPDATE, DELETE (previously only SELECT existed).
- `questions`: add INSERT, UPDATE, DELETE (previously only SELECT existed).
- All scoped to `anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because this is a no-auth single-tenant app.
4. Important Notes
- The admin panel (no auth) needs full CRUD on lessons, exams, and questions to function.
- `question_image_url` is nullable; existing questions are unaffected.
- Option images are stored as `image_url` inside each option object in the `options` JSONB array.
- true_false questions are unchanged (string array options, text correct_answer).
*/

-- Add question_image_url column
alter table questions
  add column if not exists question_image_url text;

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "public read question-images" on storage.objects;
create policy "public read question-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'question-images');

drop policy if exists "public upload question-images" on storage.objects;
create policy "public upload question-images" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'question-images');

drop policy if exists "public delete question-images" on storage.objects;
create policy "public delete question-images" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'question-images');

-- Missing CRUD policies on lessons
drop policy if exists "public insert lessons" on lessons;
create policy "public insert lessons" on lessons for insert
  to anon, authenticated with check (true);

drop policy if exists "public update lessons" on lessons;
create policy "public update lessons" on lessons for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "public delete lessons" on lessons;
create policy "public delete lessons" on lessons for delete
  to anon, authenticated using (true);

-- Missing CRUD policies on exams
drop policy if exists "public insert exams" on exams;
create policy "public insert exams" on exams for insert
  to anon, authenticated with check (true);

drop policy if exists "public update exams" on exams;
create policy "public update exams" on exams for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "public delete exams" on exams;
create policy "public delete exams" on exams for delete
  to anon, authenticated using (true);

-- Missing CRUD policies on questions
drop policy if exists "public insert questions" on questions;
create policy "public insert questions" on questions for insert
  to anon, authenticated with check (true);

drop policy if exists "public update questions" on questions;
create policy "public update questions" on questions for update
  to anon, authenticated using (true) with check (true);

drop policy if exists "public delete questions" on questions;
create policy "public delete questions" on questions for delete
  to anon, authenticated using (true);
