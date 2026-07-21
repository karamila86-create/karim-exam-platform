import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function ImageUpload({ onUploaded, label }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, { contentType: file.type });

    setUploading(false);

    if (upErr) {
      setError('فشل رفع الصورة');
      return;
    }

    const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;
    setUrl(publicUrl);
    if (onUploaded) onUploaded(publicUrl);
  }

  function removeImage() {
    setUrl(null);
    if (onUploaded) onUploaded(null);
  }

  return (
    <div className="image-upload">
      <label className="field-label">{label || 'صورة (اختياري)'}</label>
      {url ? (
        <div className="image-preview">
          <img src={url} alt="preview" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6 }} />
          <button type="button" className="cancel-btn" onClick={removeImage}>حذف الصورة</button>
        </div>
      ) : (
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      )}
      {uploading && <p>جاري الرفع...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}
