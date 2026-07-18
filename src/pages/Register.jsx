import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setError('الرقم ده مسجل بالفعل، سجل دخول من صفحة الدخول مباشرة');
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
      setError('حصل خطأ أثناء التسجيل، حاول تاني');
      return;
    }

    alert('تم التسجيل بنجاح! دلوقتي سجل دخول برقمك');
    navigate('/');
  }

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 60 }}>
        <h1>تسجيل حساب جديد</h1>
        <p>املأ بياناتك عشان تقدر تدخل المنصة</p>
        <form onSubmit={handleRegister}>
          <input
            placeholder="الاسم بالكامل"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="رقم موبايلك"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="رقم موبايل ولي الأمر"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            required
          />
          <input
            placeholder="الصف الدراسي"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          />
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'جاري التسجيل...' : 'سجّل حساب'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          عندك حساب بالفعل؟ <Link to="/" style={{ color: '#38bdf8' }}>سجل دخول من هنا</Link>
        </p>
      </div>
    </div>
  );
}
