import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setError('الرقم ده مش مسجل عندنا. لازم تسجل حساب جديد الأول.');
      return;
    }

    localStorage.setItem('student', JSON.stringify(data));
    navigate('/lessons');
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 60 }}>
        <h1>منصة كريم التعليمية</h1>
        <p>اكتب رقم موبايلك المسجل عندنا عشان تدخل</p>
        <form onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder="رقم الموبايل"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {error && (
            <p style={{ color: '#ef4444' }}>
              {error}{' '}
              <Link to="/register" style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                سجّل حساب جديد
              </Link>
            </p>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          لسه معملتش حساب؟{' '}
          <Link to="/register" style={{ color: '#38bdf8' }}>
            سجّل من هنا
          </Link>
        </p>
      </div>
    </div>
  );
}
