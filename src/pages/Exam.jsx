import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useLanguage } from '../lib/i18n.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Exam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeBlocked, setTimeBlocked] = useState(null);
  const student = JSON.parse(localStorage.getItem('student') || 'null');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!student) {
      navigate('/');
      return;
    }
    initExam();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [secondsLeft === null]);

  async function initExam() {
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index');

    setExam(examData);
    setQuestions(questionsData || []);

    if (examData && examData.start_time && examData.end_time) {
      const now = new Date();
      const start = new Date(examData.start_time);
      const end = new Date(examData.end_time);
      if (now < start) {
        setTimeBlocked({ reason: 'early', start: examData.start_time });
        return;
      }
      if (now > end) {
        setTimeBlocked({ reason: 'ended', end: examData.end_time });
        return;
      }
    }

    const { data: existingAttempt } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', student.id)
      .maybeSingle();

    let attempt = existingAttempt;
    if (!attempt) {
      const { data: newAttempt } = await supabase
        .from('exam_attempts')
        .insert({ exam_id: examId, student_id: student.id })
        .select()
        .single();
      attempt = newAttempt;
    }

    if (attempt.status !== 'in_progress') {
      navigate(`/result/${attempt.id}`);
      return;
    }

    setAttemptId(attempt.id);

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const totalSeconds = examData.duration_minutes * 60;
    setSecondsLeft(Math.max(totalSeconds - elapsedSeconds, 0));
  }

  function selectAnswer(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const rows = questions.map((q) => ({
      attempt_id: attemptId,
      question_id: q.id,
      answer_text: answers[q.id] || null,
    }));

    if (rows.length > 0) {
      await supabase.from('student_answers').insert(rows);
    }

    await supabase
      .from('exam_attempts')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', attemptId);

    navigate(`/result/${attemptId}`);
  }

  if (!exam || secondsLeft === null) {
    if (timeBlocked) {
      return (
        <div className="container">
          <LanguageSwitcher />
          <div className="card" style={{ marginTop: 60, textAlign: 'center' }}>
            <h2>{t('exam_notAvailable')}</h2>
            {timeBlocked.reason === 'early' && timeBlocked.start && (
              <p>{t('exam_opensAt')}: {new Date(timeBlocked.start).toLocaleString('ar-EG')}</p>
            )}
            {timeBlocked.reason === 'ended' && (
              <p>{t('exam_ended')}</p>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="container">
        <LanguageSwitcher />
        <div>{t('exam_loading')}</div>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="container">
      <LanguageSwitcher />
      <div className="timer">
        {t('exam_timeLeft')}: {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <h2>{exam.title}</h2>

      {questions.map((q, idx) => (
        <div className="card" key={q.id}>
          <h3>
            {idx + 1}. {q.question_text}
          </h3>
          {q.question_type === 'mcq' &&
            (q.options || []).map((opt) => (
              <button
                key={opt}
                className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => selectAnswer(q.id, opt)}
              >
                {opt}
              </button>
            ))}
          {q.question_type === 'true_false' &&
            [t('exam_true'), t('exam_false')].map((opt) => (
              <button
                key={opt}
                className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => selectAnswer(q.id, opt)}
              >
                {opt}
              </button>
            ))}
          {q.question_type === 'essay' && (
            <textarea
              rows={4}
              style={{ width: '100%', borderRadius: 8, padding: 10 }}
              value={answers[q.id] || ''}
              onChange={(e) => selectAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? t('exam_submitting') : t('exam_submit')}
      </button>
    </div>
  );
}
