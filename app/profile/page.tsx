'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, Poem, formatDate } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';

interface Profile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePic?: string;
  gender?: string;
  languagePref?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [poemModal, setPoemModal] = useState<Poem | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setEditName(`${data.user.firstName || ''} ${data.user.lastName || ''}`);
          setEditBio(data.user.bio || '');
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); router.push('/login'); });

    fetch(`${API_BASE_URL}/api/poems/my-poems`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPoems(data.poems || []))
      .catch(() => {});
  }, [router]);

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, bio: editBio }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, ...data.user });
        showToast('✨ प्रोफ़ाइल अपडेट हुई!');
        setEditModal(false);
      } else {
        showToast(data.message || '❌ अपडेट विफल।', true);
      }
    } catch {
      showToast('❌ सर्वर त्रुटि।', true);
    }
  };

  const handleDeletePoem = async (id: string) => {
    if (!confirm('क्या आप इस रचना को हटाना चाहते हैं?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/poems/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPoems(poems.filter((p) => p._id !== id));
        showToast('🗑️ रचना हटा दी गई।');
      }
    } catch {
      showToast('❌ हटाने में विफल।', true);
    }
  };

  if (loading) {
    return (
      <section style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </section>
    );
  }

  if (!profile) return null;

  return (
    <section style={{ paddingTop: '2rem' }}>
      <div className="mehfil-container">
        <div className="dashboard-grid">
          {/* Sidebar */}
          <div>
            <div className="profile-card">
              <div className="avatar-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={profile.profilePic || `https://ui-avatars.com/api/?name=${profile.firstName || 'U'}&background=C16A4B&color=fff&size=130&rounded=true`}
                  alt={profile.firstName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <h2 style={{ textAlign: 'center', fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: 'var(--accent-dark)' }}>
                {profile.firstName} {profile.lastName || ''}
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                {profile.gender || ''} · {profile.languagePref || 'hi'}
              </p>
              {profile.bio && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic' }}>
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}
              <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-value">{poems.length}</div>
                  <div className="stat-label">रचनाएँ</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">0</div>
                  <div className="stat-label">फॉलोअर</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">0</div>
                  <div className="stat-label">फॉलोइंग</div>
                </div>
              </div>
              <button className="secondary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }} onClick={() => setEditModal(true)}>
                <i className="fas fa-edit" /> प्रोफ़ाइल संपादित करें
              </button>
            </div>
          </div>

          {/* Main */}
          <div>
            <div className="glass-panel" id="my-poems">
              <div className="poem-panel-header">
                <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: 'var(--accent-dark)' }}>
                  मेरी रचनाएँ
                </h2>
                <Link href="/publish" className="primary-btn" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
                  <i className="fas fa-plus" /> नई रचना
                </Link>
              </div>
              {poems.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  ✨ अभी कोई रचना नहीं है। अपनी पहली रचना प्रकाशित करें!
                </p>
              ) : (
                poems.map((poem) => (
                  <div className="poem-card-item" key={poem._id}>
                    <div className="poem-card-info">
                      <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem' }}>{poem.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {poem.category || 'अन्य'} · {formatDate(poem.createdAt)}
                      </p>
                    </div>
                    <div className="poem-card-actions">
                      <Link href={`/poem/${poem.slug}`} className="action" style={{ fontSize: '0.8rem' }} aria-label={`${poem.title} देखें`} title="रचना देखें">
                        <i className="far fa-eye" />
                      </Link>
                      <button className="action" style={{ fontSize: '0.8rem' }} onClick={() => setPoemModal(poem)} aria-label={`${poem.title} संपादित करें`} title="रचना संपादित करें">
                        <i className="fas fa-edit" />
                      </button>
                      <button className="action" style={{ fontSize: '0.8rem', color: '#c0392b' }} onClick={() => handleDeletePoem(poem._id)} aria-label={`${poem.title} हटाएँ`} title="रचना हटाएँ">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="modal-mask" onClick={() => setEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--accent-dark)', marginBottom: '1.5rem' }}>
              प्रोफ़ाइल संपादित करें
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>नाम</label>
              <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>परिचय</label>
              <textarea className="form-input" style={{ minHeight: '80px' }} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="secondary-btn" onClick={() => setEditModal(false)}>रद्द करें</button>
              <button className="primary-btn" onClick={handleUpdateProfile}>सहेजें</button>
            </div>
          </div>
        </div>
      )}

      {/* Poem Edit Modal */}
      {poemModal && (
        <div className="modal-mask" onClick={() => setPoemModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--accent-dark)', marginBottom: '1.5rem' }}>
              रचना संपादित करें
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>शीर्षक</label>
              <input className="form-input" defaultValue={poemModal.title} readOnly />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>रचना</label>
              <textarea className="form-input" style={{ minHeight: '150px' }} defaultValue={poemModal.body} readOnly />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="secondary-btn" onClick={() => setPoemModal(null)}>बंद करें</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
