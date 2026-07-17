import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Result() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    pollResult();
  }, []);

  async function pollResult() {
    // التصحيح بيحصل عن طريق trigger في Supabase فور التسليم
    // بنعمل polling كل ثانيتين لحد ما الدرجة تظهر
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      const { data } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (data && (data.status === 'graded' || data.status === 'notified')) {
        setAttempt(data);
        setWaiting(false);
        clearInterval(interval);
      }

      if (tries > 15) {
        setWaiting(false);
        clearInterval(interval);
      }
    }, 2000);
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 60, textAlign: 'center' }}>
        {waiting && <h2>جاري تصحيح الامتحان...</h2>}
        {!waiting && attempt && (
          <>
            <h1>نتيجتك</h1>
            <h2>
              {attempt.score} / {attempt.max_score}
            </h2>
            <p>تم إرسال النتيجة لولي الأمر تلقائيًا 📩</p>
          </>
        )}
        {!waiting && !attempt && <p>حصل خطأ في تحميل النتيجة، جرب تاني</p>}
        <button onClick={() => navigate('/lessons')}>الرجوع للدروس</button>
      </div>
    </div>
  );
}
