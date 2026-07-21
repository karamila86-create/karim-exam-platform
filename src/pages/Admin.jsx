import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function Admin() {
  const [tab, setTab] = useState('approvals');
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (tab === 'approvals') loadPending();
  }, [tab]);

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
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <h1>لوحة المدرس</h1>

        <div className="admin-tabs">
          <button
            className={tab === 'lessons' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab('lessons')}
          >
            الدروس
          </button>
          <button
            className={tab === 'exams' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab('exams')}
          >
            الامتحانات
          </button>
          <button
            className={tab === 'results' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab('results')}
          >
            النتائج
          </button>
          <button
            className={tab === 'approvals' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setTab('approvals')}
          >
            الموافقات
          </button>
        </div>

        {tab === 'lessons' && <Placeholder title="الدروس" text="إدارة الدروس — قريبًا" />}
        {tab === 'exams' && <Placeholder title="الامتحانات" text="إدارة الامتحانات — قريبًا" />}
        {tab === 'results' && <Placeholder title="النتائج" text="عرض النتائج — قريبًا" />}

        {tab === 'approvals' && (
          <div className="approvals">
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
                  <button
                    className="approve-btn"
                    onClick={() => approve(s)}
                    disabled={actioningId === s.id}
                  >
                    موافقة
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => reject(s)}
                    disabled={actioningId === s.id}
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Placeholder({ title, text }) {
  return (
    <div>
      <h2>{title}</h2>
      <p className="empty">{text}</p>
    </div>
  );
}
