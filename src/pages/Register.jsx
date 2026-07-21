import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useLanguage } from '../lib/i18n.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      setError(t('register_exists'));
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('students').insert({
      full_name: fullName,
      phone,
      parent_phone: parentPhone,
      grade_level: gradeLevel,
    });

    setLoading(false);

    if (insertError) {
      setError(t('register_error'));
      return;
    }

    alert(t('register_success'));
    navigate('/');
  }

  return (
    <div className="container">
      <LanguageSwitcher />
      <div className="card" style={{ marginTop: 60 }}>
        <h1>{t('register_title')}</h1>
        <p>{t('register_subtitle')}</p>
        <form onSubmit={handleRegister}>
          <input
            placeholder={t('register_fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder={t('register_phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder={t('register_parentPhonePlaceholder')}
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            required
          />
          <input
            placeholder={t('register_gradePlaceholder')}
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? t('register_loading') : t('register_submit')}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          {t('register_haveAccount')}{' '}
          <Link to="/" style={{ color: '#38bdf8' }}>{t('register_loginHere')}</Link>
        </p>
      </div>
    </div>
  );
}
