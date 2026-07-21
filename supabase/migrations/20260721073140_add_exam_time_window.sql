/*
# Add time window columns to exams

1. Modified Tables
- `exams`
  - `start_time` (timestamptz, nullable) — when the exam becomes available to students.
    NULL means the exam is always available (no start restriction).
  - `end_time` (timestamptz, nullable) — when the exam stops being available.
    NULL means no end restriction.
2. Security
- No RLS policy changes. Existing CRUD policies on `exams` already allow anon/authenticated
  SELECT (the only operation the frontend does on exams). The new columns are covered by the
  existing `public read exams` SELECT policy.
3. Important Notes
- Both columns are nullable so existing exams keep working with no time window.
- The student Exam.jsx page checks: if both start_time and end_time are set, the current time
  must fall within the window; otherwise the exam is available as before.
- The admin exam-creation form saves these via datetime-local inputs converted to ISO strings.
*/

alter table exams
  add column if not exists start_time timestamptz,
  add column if not exists end_time timestamptz;
