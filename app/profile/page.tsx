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
  email?: string;
  city?: string;
  createdAt?: string;
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

    // Get locally stored user data as fallback
    const storedUser = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
    let localUser: Profile | null = null;
    if (storedUser) {
      try { localUser = JSON.parse(storedUser); } catch { /* ignore */ }
    }

    fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        // Merge API data with local data as fallback
        const merged = { ...(localUser || {}), ...(data.user || {}) };
        if (data.user || localUser) {
          setProfile(merged);
          setEditName(`${merged.firstName || ''} ${merged.lastName || ''}`.trim());
          setEditBio(merged.bio || '');
        }
        setLoading(false);
      })
      .catch(() => {
        // If API fails, still show local user data
        if (localUser) {
          setProfile(localUser);
          setEditName(`${localUser.firstName || ''} ${localUser.lastName || ''}`.trim());
          setEditBio(localUser.bio || '');
        }
        setLoading(false);
      });

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
        const updated = { ...profile, ...data.user };
        setProfile(updated);
        // Update localStorage too
        const stored = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const merged = { ...parsed, ...data.user };
            if (localStorage.getItem('mehfil_user')) localStorage.setItem('mehfil_user', JSON.stringify(merged));
            else sessionStorage.setItem('mehfil_user', JSON.stringify(merged));
          } catch { /* ignore */ }
        }
        showToast('प्रोफ़ाइल अपडेट हुई!');
        setEditModal(false);
      } else {
        showToast(data.message || 'अपडेट विफल।', true);
      }
    } catch {
      showToast('सर्वर त्रुटि।', true);
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
        showToast('रचना हटा दी गई।');
      }
    } catch {
      showToast('हटाने में विफल।', true);
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

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'अनाम रचनाकार';
  const genderLabel = profile.gender === 'male' ? 'पुरुष' : profile.gender === 'female' ? 'महिला' : profile.gender || '';
  const langLabel = profile.languagePref === 'hi' ? 'हिंदी'
    : profile.languagePref === 'ur' ? 'उर्दू'
    : profile.languagePref === 'en' ? 'English'
    : profile.languagePref || 'हिंदी';
  const memberSince = profile.createdAt ? formatDate(profile.createdAt) : '';
  const initials = (profile.firstName || 'U').charAt(0).toUpperCase();

  return (
    <section style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="mehfil-container">
        {/* Profile Hero Card */}
        <div className="profile-hero-card fade-up">
          {/* Cover banner */}
          <div className="profile-cover">
            <div className="profile-cover-pattern">अ क म ह र स</div>
            <div className="profile-cover-overlay" />
          </div>

          <div className="profile-hero-inner">
            <div className="profile-hero-top">
              <div className="profile-avatar-wrap">
                {profile.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt={fullName}
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">{initials}</div>
                )}
              </div>
              <div className="profile-hero-info">
                <h2 className="profile-hero-name">{fullName}</h2>
                <div className="profile-hero-tags">
                  {genderLabel && (
                    <span className="profile-tag"><i className="fas fa-user" /> {genderLabel}</span>
                  )}
                  <span className="profile-tag"><i className="fas fa-language" /> {langLabel}</span>
                  {profile.email && (
                    <span className="profile-tag profile-tag-email"><i className="far fa-envelope" /> {profile.email}</span>
                  )}
                  {profile.city && (
                    <span className="profile-tag"><i className="fas fa-map-marker-alt" /> {profile.city}</span>
                  )}
                </div>
                {profile.bio ? (
                  <p className="profile-hero-bio">&ldquo;{profile.bio}&rdquo;</p>
                ) : (
                  <p className="profile-hero-bio profile-hero-bio-empty">अभी कोई परिचय नहीं है। संपादित करें बटन दबाकर अपना परिचय जोड़ें।</p>
                )}
              </div>
              <button className="profile-edit-btn" onClick={() => setEditModal(true)}>
                <i className="fas fa-edit" /> <span>संपादित करें</span>
              </button>
            </div>

            {/* Stats */}
            <div className="profile-stats-row">
              <div className="profile-stat-item">
                <i className="fas fa-book-open" />
                <div className="profile-stat-num">{poems.length}</div>
                <div className="profile-stat-label">रचनाएँ</div>
              </div>
              <div className="profile-stat-item">
                <i className="fas fa-heart" />
                <div className="profile-stat-num">0</div>
                <div className="profile-stat-label">पसंद</div>
              </div>
              <div className="profile-stat-item">
                <i className="fas fa-calendar-plus" />
                <div className="profile-stat-num">{memberSince || '—'}</div>
                <div className="profile-stat-label">सदस्यता</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Poems */}
        <div className="glass-panel" id="my-poems" style={{ marginTop: '2rem' }}>
          <div className="poem-panel-header">
            <h2 className="poem-panel-title">
              <i className="fas fa-feather-alt" style={{ color: 'var(--accent)', marginRight: '10px' }} />
              मेरी रचनाएँ
            </h2>
            <Link href="/publish" className="primary-btn" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
              <i className="fas fa-plus" /> नई रचना
            </Link>
          </div>
          {poems.length === 0 ? (
            <div className="profile-empty-state">
              <i className="fas fa-pen-fancy" />
              <p>अभी कोई रचना नहीं है। अपनी पहली रचना प्रकाशित करें!</p>
              <Link href="/publish" className="primary-btn" style={{ marginTop: '1rem' }}>
                <i className="fas fa-feather" /> लेखन प्रारम्भ करें
              </Link>
            </div>
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
