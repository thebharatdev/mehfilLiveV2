'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    gender: 'male', dob: '', languagePref: 'hi',
  });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -5;
    const ry = ((x - cx) / cx) * 5;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const resetTilt = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  const checkStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    setStrength(s);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('❌ पासवर्ड मेल नहीं खाते।', true);
      return;
    }
    const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
    if (age < 13) {
      showToast('❌ आपकी आयु 13 वर्ष से कम है।', true);
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (profilePic) fd.append('profilePic', profilePic);

      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mehfil_user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        showToast('✨ मेहफ़िल में आपका स्वागत है!');
        setTimeout(() => router.push('/'), 800);
      } else {
        showToast(data.message || '❌ पंजीकरण विफल।', true);
      }
    } catch {
      showToast('❌ सर्वर से कनेक्ट नहीं हो सका।', true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="auth-orb orb-1" />
      <div className="auth-orb orb-2" />
      <div className="auth-orb orb-3" />

      <Link href="/" className="back-link" style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <i className="fas fa-arrow-left" /> मुखपृष्ठ
      </Link>

      <div
        ref={cardRef}
        className="glass-card"
        style={{ width: '100%', maxWidth: '900px', transition: 'transform 0.2s ease-out' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
      >
        <div className="auth-grid">
          <div className="auth-art">
            <div style={{ position: 'relative', zIndex: 2 }}>
              <i className="fas fa-feather-alt" style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '1rem' }} />
              <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--accent-dark)' }}>
                काव्य यात्रा शुरू करें
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1.1rem' }}>
                अपनी रचनाओं को दुनिया तक पहुँचाइए
              </p>
            </div>
          </div>

          <div className="auth-form-side">
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', color: 'var(--accent-dark)', marginBottom: '0.5rem' }}>
              पंजीकरण करें
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <label style={{ cursor: 'pointer' }}>
                  <img
                    className="profile-preview"
                    src={profilePic || `https://ui-avatars.com/api/?name=U&background=C16A4B&color=fff&size=90&rounded=true`}
                    alt="Profile"
                  />
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-input-group">
                  <i className="fas fa-user auth-input-icon" />
                  <input className="auth-input" placeholder="पहला नाम" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div className="auth-input-group">
                  <i className="fas fa-user auth-input-icon" />
                  <input className="auth-input" placeholder="अंतिम नाम" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-input-group">
                  <i className="fas fa-venus-mars auth-input-icon" />
                  <select className="auth-input" style={{ appearance: 'none' }} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="male">पुरुष</option>
                    <option value="female">महिला</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not">बताना नहीं चाहते</option>
                  </select>
                </div>
                <div className="auth-input-group">
                  <i className="fas fa-calendar auth-input-icon" />
                  <input className="auth-input" type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required />
                </div>
              </div>
              <div className="auth-input-group">
                <i className="fas fa-envelope auth-input-icon" />
                <input className="auth-input" type="email" placeholder="ईमेल" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="auth-input-group">
                <i className="fas fa-lock auth-input-icon" />
                <input className="auth-input" type="password" placeholder="पासवर्ड" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); checkStrength(e.target.value); }} required />
              </div>
              {strength > 0 && (
                <div className="strength-meter">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`strength-bar ${strength >= i ? 'active ' + (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''}`} />
                  ))}
                </div>
              )}
              <div className="auth-input-group">
                <i className="fas fa-lock auth-input-icon" />
                <input className="auth-input" type="password" placeholder="पासवर्ड पुष्टि करें" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
              </div>
              <div className="auth-input-group">
                <i className="fas fa-language auth-input-icon" />
                <select className="auth-input" style={{ appearance: 'none' }} value={formData.languagePref} onChange={(e) => setFormData({ ...formData, languagePref: e.target.value })}>
                  <option value="hi">हिंदी</option>
                  <option value="ur">उर्दू</option>
                  <option value="en">English</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>
              <button className="primary-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : 'पंजीकरण करें'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              पहले से सदस्य? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>प्रवेश करें</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
