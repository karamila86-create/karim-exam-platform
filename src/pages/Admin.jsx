import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const ADMIN_PASSWORD = 'admin123';

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_authed', '1');
      setAuthed(true);
    } else {
      setPwError('كلمة السر غلط');
    }
  }

  if (!authed) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: 60 }}>
          <h1>لوحة المدرس</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="كلمة السر"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwError(''); }}
            />
            {pwError && <p style={{ color: '#ef4444' }}>{pwError}</p>}
            <button type="submit">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminPanel onLogout={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }} />;
}

function AdminPanel({ onLogout }) {
  const [view, setView] = useState('grades');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);

  function backToGrades() {
    setView('grades');
    setSelectedGrade(null);
    setSelectedLesson(null);
    setSelectedExam(null);
  }

  function backToLessons() {
    setView('lessons');
    setSelectedLesson(null);
    setSelectedExam(null);
  }

  function backToExams() {
    setView('exams');
    setSelectedExam(null);
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <div className="admin-top-bar">
          <h1>لوحة المدرس</h1>
          <div className="admin-top-actions">
            <button className="tab-btn" onClick={() => { setView('results'); }}>النتائج</button>
            <button className="tab-btn" onClick={() => { setView('approvals'); }}>الموافقات</button>
            <button className="tab-btn" onClick={onLogout}>خروج</button>
          </div>
        </div>

        {view === 'grades' && <GradesView onSelectGrade={(g) => { setSelectedGrade(g); setView('lessons'); }} />}
        {view === 'lessons' && selectedGrade && (
          <LessonsView
            grade={selectedGrade}
            onSelectLesson={(l) => { setSelectedLesson(l); setView('exams'); }}
            onBack={backToGrades}
          />
        )}
        {view === 'exams' && selectedLesson && (
          <ExamsView
            lesson={selectedLesson}
            onSelectExam={(ex) => { setSelectedExam(ex); setView('questions'); }}
            onBack={backToLessons}
          />
        )}
        {view === 'questions' && selectedExam && (
          <QuestionsView exam={selectedExam} onBack={backToExams} />
        )}
        {view === 'results' && <ResultsView onBack={backToGrades} />}
        {view === 'approvals' && <ApprovalsView />}
      </div>
    </div>
  );
}

function BackButton({ onClick, label }) {
  return (
    <button className="back-btn" onClick={onClick}>
      ← {label || 'رجوع'}
    </button>
  );
}

function GradesView({ onSelectGrade }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGrade, setNewGrade] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newVideo, setNewVideo] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('lessons').select('grade_level');
    const unique = [...new Set((data || []).map((r) => r.grade_level).filter(Boolean))];
    setGrades(unique);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addGradeWithLesson(e) {
    e.preventDefault();
    if (!newGrade.trim()) return;
    const { error } = await supabase.from('lessons').insert({
      title: newTitle || `${newGrade} - أول درس`,
      video_url: newVideo || null,
      grade_level: newGrade.trim(),
    });
    if (!error) {
      setShowForm(false);
      setNewGrade(''); setNewTitle(''); setNewVideo('');
      load();
    }
  }

  return (
    <div>
      <h2>اختر الصف الدراسي</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && grades.length === 0 && !showForm && (
        <p className="empty">لا يوجد صفوف بعد. أضف صف جديد للبدء.</p>
      )}
      <div className="grade-list">
        {grades.map((g) => (
          <button key={g} className="grade-card" onClick={() => onSelectGrade(g)}>
            {g}
          </button>
        ))}
      </div>

      {!showForm ? (
        <button className="add-btn" onClick={() => setShowForm(true)}>+ إضافة صف جديد</button>
      ) : (
        <div className="card">
          <h3>إضافة صف جديد (مع أول درس)</h3>
          <form onSubmit={addGradeWithLesson}>
            <input placeholder="اسم الصف (مثال: الصف الأول الثانوي)" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} required />
            <input placeholder="عنوان أول درس" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <input placeholder="رابط فيديو الدرس (اختياري)" value={newVideo} onChange={(e) => setNewVideo(e.target.value)} />
            <div className="form-actions">
              <button type="submit">إضافة</button>
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function LessonsView({ grade, onSelectLesson, onBack }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [resources, setResources] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('grade_level', grade)
      .order('created_at', { ascending: false });
    setLessons(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [grade]);

  async function addLesson(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const resourceArr = resources
      ? resources.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    const { error } = await supabase.from('lessons').insert({
      title: title.trim(),
      video_url: videoUrl || null,
      resource_urls: resourceArr,
      grade_level: grade,
    });
    if (!error) {
      setTitle(''); setVideoUrl(''); setResources('');
      load();
    }
  }

  return (
    <div>
      <BackButton onClick={onBack} label="رجوع للصفوف" />
      <h2>دروس: {grade}</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && lessons.length === 0 && <p className="empty">لا يوجد دروس في هذا الصف بعد.</p>}
      {lessons.map((l) => (
        <div className="card lesson-item" key={l.id}>
          <h3>{l.title}</h3>
          {l.video_url && <a className="lesson-link" href={l.video_url} target="_blank" rel="noreferrer">▶ الفيديو</a>}
          <button onClick={() => onSelectLesson(l)}>إدارة الامتحانات ←</button>
        </div>
      ))}

      <div className="card">
        <h3>إضافة درس جديد</h3>
        <form onSubmit={addLesson}>
          <input placeholder="عنوان الدرس" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="رابط الفيديو" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          <textarea
            placeholder="روابط إضافية (كل رابط في سطر)"
            rows={3}
            style={{ width: '100%', borderRadius: 8, padding: 10 }}
            value={resources}
            onChange={(e) => setResources(e.target.value)}
          />
          <button type="submit">إضافة الدرس</button>
        </form>
      </div>
    </div>
  );
}

function ExamsView({ lesson, onSelectExam, onBack }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [passScore, setPassScore] = useState(50);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('created_at', { ascending: false });
    setExams(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [lesson.id]);

  async function addExam(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase.from('exams').insert({
      lesson_id: lesson.id,
      title: title.trim(),
      duration_minutes: parseInt(duration, 10) || 30,
      pass_score: parseFloat(passScore) || 50,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
    });
    if (!error) {
      setTitle(''); setDuration(30); setPassScore(50); setStartTime(''); setEndTime('');
      load();
    }
  }

  return (
    <div>
      <BackButton onClick={onBack} label="رجوع للدروس" />
      <h2>امتحانات: {lesson.title}</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && exams.length === 0 && <p className="empty">لا يوجد امتحانات لهذا الدرس بعد.</p>}
      {exams.map((ex) => (
        <div className="card exam-item" key={ex.id}>
          <h3>{ex.title}</h3>
          <p>المدة: {ex.duration_minutes} دقيقة</p>
          <p>درجة النجاح: {ex.pass_score}</p>
          {ex.start_time && <p>يبدأ: {new Date(ex.start_time).toLocaleString('ar-EG')}</p>}
          {ex.end_time && <p>ينتهي: {new Date(ex.end_time).toLocaleString('ar-EG')}</p>}
          <button onClick={() => onSelectExam(ex)}>إدارة الأسئلة ←</button>
        </div>
      ))}

      <div className="card">
        <h3>إنشاء امتحان جديد</h3>
        <form onSubmit={addExam}>
          <input placeholder="عنوان الامتحان" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label className="field-label">المدة بالدقائق</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          <label className="field-label">درجة النجاح</label>
          <input type="number" value={passScore} onChange={(e) => setPassScore(e.target.value)} min="0" max="100" />
          <label className="field-label">وقت بداية الامتحان (اختياري)</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <label className="field-label">وقت نهاية الامتحان (اختياري)</label>
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <button type="submit">إنشاء الامتحان</button>
        </form>
      </div>
    </div>
  );
}

function QuestionsView({ exam, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qType, setQType] = useState('mcq');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('order_index');
    setQuestions(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [exam.id]);

  function setOption(i, val) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  async function addQuestion(e) {
    e.preventDefault();
    if (!qText.trim()) return;

    let opts = null;
    let correct = correctAnswer;
    if (qType === 'mcq') {
      opts = options.filter((o) => o.trim());
      if (!correct) correct = opts[0] || '';
    } else if (qType === 'true_false') {
      opts = ['صح', 'خطأ'];
      if (!correct) correct = 'صح';
    }

    const { error } = await supabase.from('questions').insert({
      exam_id: exam.id,
      question_text: qText.trim(),
      question_type: qType,
      options: opts,
      correct_answer: correct,
      order_index: questions.length,
    });
    if (!error) {
      setQText(''); setOptions(['', '', '', '']); setCorrectAnswer('');
      load();
    }
  }

  async function deleteQuestion(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) load();
  }

  return (
    <div>
      <BackButton onClick={onBack} label="رجوع للامتحانات" />
      <h2>أسئلة: {exam.title}</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && questions.length === 0 && <p className="empty">لا يوجد أسئلة بعد.</p>}
      {questions.map((q, idx) => (
        <div className="card" key={q.id}>
          <div className="question-header">
            <h3>{idx + 1}. {q.question_text}</h3>
            <button className="delete-btn" onClick={() => deleteQuestion(q.id)}>حذف</button>
          </div>
          <p className="qtype-badge">{q.question_type === 'mcq' ? 'اختيار من متعدد' : 'صح/خطأ'}</p>
          {q.options && (
            <ul>
              {q.options.map((o, i) => (
                <li key={i} className={o === q.correct_answer ? 'correct-opt' : ''}>
                  {o} {o === q.correct_answer && '✓'}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="card">
        <h3>إضافة سؤال جديد</h3>
        <form onSubmit={addQuestion}>
          <label className="field-label">نوع السؤال</label>
          <select value={qType} onChange={(e) => { setQType(e.target.value); setCorrectAnswer(''); }}>
            <option value="mcq">اختيار من متعدد</option>
            <option value="true_false">صح / خطأ</option>
          </select>
          <label className="field-label">نص السؤال</label>
          <input placeholder="اكتب السؤال" value={qText} onChange={(e) => setQText(e.target.value)} required />

          {qType === 'mcq' && (
            <>
              <label className="field-label">الاختيارات</label>
              {options.map((o, i) => (
                <input
                  key={i}
                  placeholder={`اختيار ${i + 1}`}
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                />
              ))}
              <label className="field-label">الإجابة الصحيحة (اكتبها زي ما كتبتها فوق)</label>
              <input placeholder="الإجابة الصحيحة" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
            </>
          )}
          {qType === 'true_false' && (
            <label className="field-label">
              الإجابة الصحيحة
              <select value={correctAnswer || 'صح'} onChange={(e) => setCorrectAnswer(e.target.value)}>
                <option value="صح">صح</option>
                <option value="خطأ">خطأ</option>
              </select>
            </label>
          )}
          <button type="submit">إضافة السؤال</button>
        </form>
      </div>
    </div>
  );
}

function ResultsView({ onBack }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, student_id, score, max_score, status, submitted_at, exams(title), students(full_name, phone)')
        .order('submitted_at', { ascending: false });
      setAttempts(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <BackButton onClick={onBack} label="رجوع" />
      <h2>النتائج</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && attempts.length === 0 && <p className="empty">لا توجد نتائج بعد.</p>}
      {attempts.map((a) => (
        <div className="card" key={a.id}>
          <h3>{a.students?.full_name || 'طالب'}</h3>
          <p>الامتحان: {a.exams?.title || '—'}</p>
          <p>النتيجة: {a.score} / {a.max_score}</p>
          <p>الحالة: {a.status}</p>
          {a.submitted_at && <p>سلّم في: {new Date(a.submitted_at).toLocaleString('ar-EG')}</p>}
        </div>
      ))}
    </div>
  );
}

function ApprovalsView() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    setPending(data || []);
    setLoading(false);
  }

  async function approve(student) {
    setActioningId(student.id);
    const { error } = await supabase
      .from('students')
      .update({ is_approved: true })
      .eq('id', student.id);
    setActioningId(null);
    if (!error) setPending((prev) => prev.filter((s) => s.id !== student.id));
  }

  async function reject(student) {
    setActioningId(student.id);
    const { error } = await supabase.from('students').delete().eq('id', student.id);
    setActioningId(null);
    if (!error) setPending((prev) => prev.filter((s) => s.id !== student.id));
  }

  return (
    <div>
      <h2>طلبات التسجيل بانتظار الموافقة</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && pending.length === 0 && (
        <p className="empty">لا يوجد طلبات بانتظار الموافقة</p>
      )}
      {pending.map((s) => (
        <div className="card approval-card" key={s.id}>
          <div className="approval-info">
            <h3>{s.full_name}</h3>
            <p>رقم الطالب: {s.phone}</p>
            <p>رقم ولي الأمر: {s.parent_phone}</p>
            {s.grade_level && <p>الصف: {s.grade_level}</p>}
          </div>
          <div className="approval-actions">
            <button className="approve-btn" onClick={() => approve(s)} disabled={actioningId === s.id}>موافقة</button>
            <button className="reject-btn" onClick={() => reject(s)} disabled={actioningId === s.id}>رفض</button>
          </div>
        </div>
      ))}
    </div>
  );
}
