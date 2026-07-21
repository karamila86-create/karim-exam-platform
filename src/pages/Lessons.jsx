import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useLanguage } from '../lib/i18n.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem('student');
    if (!stored) {
      navigate('/');
      return;
    }
    const s = JSON.parse(stored);
    setStudent(s);
    loadData();
  }, []);

  async function loadData() {
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .eq('is_active', true);

    setLessons(lessonsData || []);
    setExams(examsData || []);
  }

  return (
    <div className="container">
      <LanguageSwitcher />
      <h2>{t('lessons_welcome')} {student?.full_name}</h2>

      <h3>{t('lessons_section')}</h3>
      {lessons.map((lesson) => (
        <div className="card" key={lesson.id}>
          <h3>{lesson.title}</h3>
          {lesson.video_url && (
            <a className="lesson-link" href={lesson.video_url} target="_blank" rel="noreferrer">
              {t('lessons_watchVideo')}
            </a>
          )}
          {(lesson.resource_urls || []).map((url, i) => (
            <a className="lesson-link" href={url} key={i} target="_blank" rel="noreferrer">
              {t('lessons_attachment')} {i + 1}
            </a>
          ))}
        </div>
      ))}

      <h3>{t('lessons_examsSection')}</h3>
      {exams.map((exam) => (
        <div className="card" key={exam.id}>
          <h3>{exam.title}</h3>
          <p>{t('lessons_duration')}: {exam.duration_minutes} {t('lessons_minutes')}</p>
          <button onClick={() => navigate(`/exam/${exam.id}`)}>{t('lessons_startExam')}</button>
        </div>
      ))}
    </div>
  );
}
