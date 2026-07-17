import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

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
      <h2>أهلاً {student?.full_name}</h2>

      <h3>الدروس</h3>
      {lessons.map((lesson) => (
        <div className="card" key={lesson.id}>
          <h3>{lesson.title}</h3>
          {lesson.video_url && (
            <a className="lesson-link" href={lesson.video_url} target="_blank" rel="noreferrer">
              ▶ شاهد الفيديو
            </a>
          )}
          {(lesson.resource_urls || []).map((url, i) => (
            <a className="lesson-link" href={url} key={i} target="_blank" rel="noreferrer">
              📎 ملحق {i + 1}
            </a>
          ))}
        </div>
      ))}

      <h3>الامتحانات المتاحة</h3>
      {exams.map((exam) => (
        <div className="card" key={exam.id}>
          <h3>{exam.title}</h3>
          <p>المدة: {exam.duration_minutes} دقيقة</p>
          <button onClick={() => navigate(`/exam/${exam.id}`)}>ابدأ الامتحان</button>
        </div>
      ))}
    </div>
  );
}
