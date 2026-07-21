import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useLanguage } from '../lib/i18n.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Result() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [attempt, setAttempt] = useState(null);
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    pollResult();
  }, []);

  async function pollResult() {
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
      <LanguageSwitcher />
      <div className="card" style={{ marginTop: 60, textAlign: 'center' }}>
        {waiting && <h2>{t('result_grading')}</h2>}
        {!waiting && attempt && (
          <>
            <h1>{t('result_title')}</h1>
            <h2>
              {attempt.score} / {attempt.max_score}
            </h2>
            <p>{t('result_sentToParent')}</p>
          </>
        )}
        {!waiting && !attempt && <p>{t('result_error')}</p>}
        <button onClick={() => navigate('/lessons')}>{t('result_backToLessons')}</button>
      </div>
    </div>
  );
}
