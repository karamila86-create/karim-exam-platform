import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useLanguage } from '../lib/i18n.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    setLoading(false);

    if (dbError || !data) {
      setError(t('login_notRegistered'));
      return;
    }

    if (!data.is_approved) {
      setError(t('login_notApproved'));
      return;
    }

    localStorage.setItem('student', JSON.stringify(data));
    navigate('/lessons');
  }

  return (
    <div className="container">
      <LanguageSwitcher />
      <div className="card" style={{ marginTop: 60 }}>
        <h1>{t('login_title')}</h1>
        <p>{t('login_subtitle')}</p>
        <form onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder={t('login_phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {error && (
            <p style={{ color: '#ef4444' }}>
              {error}{' '}
              {error === t('login_notRegistered') && (
                <Link to="/register" style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                  {t('login_registerLink')}
                </Link>
              )}
            </p>
          )}
          <button type="submit" disabled={loading}>
            {loading ? t('login_checking') : t('login_submit')}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          {t('login_noAccount')}{' '}
          <Link to="/register" style={{ color: '#38bdf8' }}>
            {t('login_registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
