'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (localStorage.getItem('mehfil_remember') !== 'true') return;
    const storedUser = localStorage.getItem('mehfil_user');
    if (!storedUser) return;
    try {
      const savedUser = JSON.parse(storedUser) as { email?: string };
      if (savedUser.email) {
        setEmail(savedUser.email);
        setRemember(true);
      }
    } catch {
      localStorage.removeItem('mehfil_user');
      localStorage.removeItem('mehfil_remember');
    }
  }, []);

  const handleForgotPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    showToast('🕊️ पासवर्ड पुनर्प्राप्ति सुविधा जल्द उपलब्ध होगी।');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.user || !data.token) {
        showToast(data.message || '❌ लॉगिन विफल।', true);
        return;
      }

      const userData = {
        ...data.user,
        id: data.user._id,
      };
      sessionStorage.removeItem('mehfil_user');
      localStorage.removeItem('mehfil_user');
      if (remember) {
        localStorage.setItem('mehfil_user', JSON.stringify(userData));
        localStorage.setItem('mehfil_remember', 'true');
      } else {
        sessionStorage.setItem('mehfil_user', JSON.stringify(userData));
        localStorage.removeItem('mehfil_remember');
      }
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('mehfil-auth-change'));
      showToast(`✨ स्वागत है ${data.user.firstName}! आपकी कविता यात्रा शुरू होती है।`);
      setTimeout(() => router.push('/profile'), 800);
    } catch {
      showToast('❌ सर्वर से कनेक्ट नहीं हो सका।', true);
    } finally {
      setLoading(false);
    }
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
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 320 }}>
              <i className="fas fa-feather-alt" style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '1rem' }} />
              <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', color: 'var(--accent-dark)' }}>
                अल्फ़ाज़ की महफ़िल
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7 }}>
                “हर लफ्ज़ एक एहसास है, हर शे’र एक दास्ताँ।”
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(193, 106, 75, 0.3)', color: '#936E56', fontSize: '1.1rem' }}>
                <i className="fas fa-moon" /> जहाँ अल्फ़ाज़ महसूसात बन जाते हैं
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div style={{ marginBottom: '1rem' }}>
              <i className="fas fa-feather-alt" style={{ fontSize: '2rem', color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.4rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
              स्वागत है
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', borderLeft: '2px solid var(--accent)', paddingLeft: 12, fontSize: '0.9rem' }}>
              अपने खाते में प्रवेश करें और रचनात्मकता में डूब जाएँ।
            </p>

            <form onSubmit={handleLogin}>
              <div className="auth-input-group">
                <i className="fas fa-envelope auth-input-icon" />
                <input
                  className="auth-input"
                  type="email"
                  placeholder="ईमेल / Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-input-group">
                <i className="fas fa-lock auth-input-icon" />
                <input
                  className="auth-input"
                  type="password"
                  placeholder="पासवर्ड / Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  मुझे याद रखें
                </label>
                <button type="button" onClick={handleForgotPassword} style={{ border: 'none', background: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--accent)', cursor: 'pointer' }}>पासवर्ड भूल गए?</button>
              </div>
              <button className="primary-btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> कृपया प्रतीक्षा करें...</> : <><i className="fas fa-pen-fancy" /> प्रवेश करें</>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(200, 180, 160, 0.3)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              क्या आप नए सदस्य हैं? <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>नई रचना शुरू करें →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
