'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from '@/lib/navigation';
import Link from '@/lib/navigation';
import { API_BASE_URL, Poem, formatDate } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';
import { matchesSearch } from '@/lib/search';

interface Profile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePic?: string;
  gender?: string;
  languagePref?: string;
  email?: string;
  city?: string;
  role?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile modal states
  const [editModal, setEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editGender, setEditGender] = useState('male');
  const [editLanguagePref, setEditLanguagePref] = useState('hi');
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Poem view & edit states
  const [viewPoemModal, setViewPoemModal] = useState<Poem | null>(null);
  const [editPoemModal, setEditPoemModal] = useState<Poem | null>(null);
  const [poemTitle, setPoemTitle] = useState('');
  const [poemCategory, setPoemCategory] = useState('');
  const [poemBody, setPoemBody] = useState('');
  const [savingPoem, setSavingPoem] = useState(false);

  // Search & filter within creations
  const [searchRachnaye, setSearchRachnaye] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const modalPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
    let localUser: Profile | null = null;
    if (storedUser) {
      try {
        localUser = JSON.parse(storedUser);
      } catch {
        /* ignore */
      }
    }

    // Set initial from local state immediately to eliminate any blank flash
    if (localUser) {
      setProfile(localUser);
      populateEditForm(localUser);
    }

    // Fetch live profile from backend
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const merged: Profile = { ...(localUser || {}), ...(data.user || {}) };
        if (data.user || localUser) {
          setProfile(merged);
          populateEditForm(merged);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch user's poems
    fetch(`${API_BASE_URL}/api/poems/my-poems`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPoems(data.poems || []))
      .catch(() => {});
  }, []);

  const populateEditForm = (u: Profile) => {
    setEditFirstName(u.firstName || '');
    setEditLastName(u.lastName || '');
    setEditBio(u.bio || '');
    setEditCity(u.city || '');
    setEditGender(u.gender || 'male');
    setEditLanguagePref(u.languagePref || 'hi');
    setEditPhotoPreview(u.profilePic || '');
  };

  const persistUserUpdate = (updated: Profile) => {
    setProfile(updated);
    try {
      const stored = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
      const base = stored ? JSON.parse(stored) : {};
      const merged = { ...base, ...updated };
      if (localStorage.getItem('mehfil_user')) {
        localStorage.setItem('mehfil_user', JSON.stringify(merged));
      } else {
        sessionStorage.setItem('mehfil_user', JSON.stringify(merged));
      }
    } catch {
      /* ignore */
    }
    // Notify Header and other components to update
    window.dispatchEvent(new Event('mehfil-auth-change'));
  };

  // Direct avatar file change
  const handleDirectAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('फ़ोटो 5MB से छोटी होनी चाहिए।', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Update locally immediately for instant feedback
      const updated = { ...(profile || {}), profilePic: dataUrl };
      persistUserUpdate(updated);
      setEditPhotoPreview(dataUrl);
      showToast('✨ प्रोफ़ाइल फ़ोटो अपडेट हो गई!');

      // Sync with server
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const fd = new FormData();
          fd.append('profilePic', file);
          await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } catch {
          // JSON fallback if multipart is not supported on PUT
          try {
            await fetch(`${API_BASE_URL}/api/auth/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ profilePic: dataUrl }),
            });
          } catch {
            /* ignore network errors; local state is preserved */
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Modal file picker handler
  const handleModalPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('फ़ोटो 5MB से छोटी होनी चाहिए।', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) setEditPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Full profile modal save
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const token = localStorage.getItem('token');
    const payload = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      name: `${editFirstName.trim()} ${editLastName.trim()}`.trim(),
      bio: editBio.trim(),
      city: editCity.trim(),
      gender: editGender,
      languagePref: editLanguagePref,
      profilePic: editPhotoPreview,
    };

    // Update locally right away
    const updated = { ...(profile || {}), ...payload };
    persistUserUpdate(updated);

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.user) {
          persistUserUpdate({ ...updated, ...data.user });
        }
      } catch {
        /* preserved in localStorage */
      }
    }

    setSavingProfile(false);
    setEditModal(false);
    showToast('✨ प्रोफ़ाइल सफलतापूर्वक सहेजी गई!');
  };

  const handleLogout = () => {
    if (!confirm('क्या आप सचमुच लॉगआउट करना चाहते हैं?')) return;
    localStorage.removeItem('mehfil_user');
    localStorage.removeItem('mehfil_remember');
    localStorage.removeItem('token');
    sessionStorage.removeItem('mehfil_user');
    window.dispatchEvent(new Event('mehfil-auth-change'));
    router.push('/');
  };

  // Poem handlers
  const openEditPoem = (poem: Poem) => {
    setEditPoemModal(poem);
    setPoemTitle(poem.title || '');
    setPoemCategory(poem.category || 'कविता');
    setPoemBody(poem.body || '');
  };

  const handleSavePoem = async () => {
    if (!editPoemModal) return;
    if (!poemTitle.trim() || !poemBody.trim()) {
      showToast('शीर्षक और रचना दोनों आवश्यक हैं।', true);
      return;
    }
    setSavingPoem(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/poems/${editPoemModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: poemTitle.trim(),
          category: poemCategory,
          body: poemBody.trim(),
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setPoems((prev) =>
          prev.map((p) =>
            p._id === editPoemModal._id
              ? { ...p, title: poemTitle.trim(), category: poemCategory, body: poemBody.trim() }
              : p
          )
        );
        showToast('✨ रचना सफलतापूर्वक अपडेट हुई!');
        setEditPoemModal(null);
      } else {
        showToast(data.message || 'रचना अपडेट विफल।', true);
      }
    } catch {
      showToast('सर्वर त्रुटि।', true);
    }
    setSavingPoem(false);
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
        setPoems((prev) => prev.filter((p) => p._id !== id));
        showToast('रचना हटा दी गई।');
      } else {
        showToast('हटाने में विफल।', true);
      }
    } catch {
      showToast('हटाने में विफल।', true);
    }
  };

  // Filter poems by search query and category
  const filteredPoems = useMemo(() => {
    let list = poems;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => (p.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }
    if (searchRachnaye.trim()) {
      list = list.filter((p) =>
        matchesSearch(searchRachnaye, p.title || '', p.body || '', p.category || '')
      );
    }
    return list;
  }, [poems, categoryFilter, searchRachnaye]);

  // Available categories for filter pills
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    poems.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [poems]);

  if (loading && !profile) {
    return (
      <section className="profile-loading-wrap">
        <div className="profile-loader-content">
          <div className="spinner" />
          <p className="loader-text font-tiro">साहित्यिक प्रोफ़ाइल सज रही है...</p>
        </div>
      </section>
    );
  }

  const user = profile || {};
  const fullName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'भारत भूषण';
  const initials = (user.firstName || 'B').charAt(0).toUpperCase();
  const genderDisplay =
    user.gender === 'female' ? 'महिला' : user.gender === 'other' ? 'अन्य' : 'पुरुष';
  const langDisplay =
    user.languagePref === 'ur'
      ? 'उर्दू'
      : user.languagePref === 'en'
      ? 'English'
      : 'हिंदी';
  const memberSince = user.createdAt ? formatDate(user.createdAt) : '2026';
  const roleDisplay =
    user.bio?.toLowerCase().includes('founder') || user.role === 'admin'
      ? 'Founder'
      : 'रचनाकार';

  return (
    <section className="profile-page-wrap">
      <div className="mehfil-container">
        {/* Hidden file input for fast avatar upload */}
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleDirectAvatarUpload}
        />

        {/* Profile Hero Card - Always fully visible, never opacity: 0 */}
        <div className="profile-hero-card" style={{ opacity: 1, transform: 'none' }}>
          {/* Cover Banner */}
          <div className="profile-cover">
            <div className="profile-cover-pattern">✦ अ क म ह र स · मेहफ़िल ✦</div>
            <div className="profile-cover-overlay" />
            <div className="profile-cover-deco profile-cover-deco-1">❦</div>
            <div className="profile-cover-deco profile-cover-deco-2">✿</div>
          </div>

          {/* Hero Content */}
          <div className="profile-hero-inner">
            <div className="profile-hero-top">
              {/* Avatar with Camera Upload Badge */}
              <div className="profile-avatar-wrap">
                <div className="profile-avatar-ring">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={fullName}
                      className="profile-avatar-img"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder font-rozha">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Direct photo upload camera button */}
                <button
                  type="button"
                  className="profile-avatar-upload-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  title="फ़ोटो बदलें / अपलोड करें"
                  aria-label="फ़ोटो बदलें"
                >
                  <i className="fas fa-camera" />
                </button>
              </div>

              {/* User Info & Identity */}
              <div className="profile-hero-info">
                <div className="profile-hero-name-row">
                  <h1 className="profile-hero-name font-rozha" style={{ margin: 0 }}>
                    {fullName}
                  </h1>
                  {roleDisplay && (
                    <span className="profile-role-badge">
                      <i className="fas fa-crown" style={{ color: '#d97706' }} />
                      {roleDisplay}
                    </span>
                  )}
                </div>

                {/* Identity Tags */}
                <div className="profile-hero-tags">
                  <span className="profile-tag">
                    <i className="fas fa-user" /> {genderDisplay}
                  </span>
                  <span className="profile-tag">
                    <i className="fas fa-language" /> {langDisplay}
                  </span>
                  {user.city && (
                    <span className="profile-tag">
                      <i className="fas fa-map-marker-alt" /> {user.city}
                    </span>
                  )}
                </div>

                {/* Email */}
                {user.email && (
                  <div className="profile-email-row">
                    <i className="far fa-envelope" />
                    <span>{user.email}</span>
                  </div>
                )}

                {/* Bio in classical quotation */}
                <div style={{ marginTop: '0.6rem' }}>
                  {user.bio ? (
                    <p className="profile-hero-bio font-tiro" style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>
                      &ldquo;{user.bio}&rdquo;
                    </p>
                  ) : (
                    <p className="profile-hero-bio profile-hero-bio-empty font-tiro">
                      &ldquo;साहित्य, संवेदना और शब्दों का साधक।&rdquo;
                    </p>
                  )}
                </div>

                {/* Action Buttons Bar */}
                <div className="profile-actions-bar">
                  <button
                    type="button"
                    className="profile-action-btn-primary"
                    onClick={() => {
                      populateEditForm(user);
                      setEditModal(true);
                    }}
                  >
                    <i className="fas fa-user-edit" />
                    <span>प्रोफ़ाइल संपादित करें</span>
                  </button>

                  <button
                    type="button"
                    className="profile-action-btn-secondary"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <i className="fas fa-camera" />
                    <span>फ़ोटो बदलें</span>
                  </button>

                  <Link href="/publish" className="profile-action-btn-secondary">
                    <i className="fas fa-feather-alt" />
                    <span>नई रचना</span>
                  </Link>

                  <button
                    type="button"
                    className="profile-action-btn-danger"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt" />
                    <span>लॉगआउट</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Row - 3 Proportional Cards matching reference */}
            <div className="profile-stats-row">
              <div className="profile-stat-item">
                <div className="profile-stat-icon-wrap">
                  <i className="fas fa-book-open" />
                </div>
                <div className="profile-stat-num font-rozha">{poems.length}</div>
                <div className="profile-stat-label">रचनाएँ</div>
              </div>

              <div className="profile-stat-item">
                <div className="profile-stat-icon-wrap">
                  <i className="fas fa-heart" />
                </div>
                <div className="profile-stat-num font-rozha">0</div>
                <div className="profile-stat-label">पसंद</div>
              </div>

              <div className="profile-stat-item">
                <div className="profile-stat-icon-wrap">
                  <i className="fas fa-calendar-check" />
                </div>
                <div className="profile-stat-num profile-stat-date font-tiro">
                  {memberSince || 'सदस्य'}
                </div>
                <div className="profile-stat-label">सदस्यता</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Creations (मेरी रचनाएँ) Section */}
        <div className="glass-panel profile-poems-panel" id="my-poems" style={{ opacity: 1 }}>
          <div className="profile-rachnaye-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="poem-panel-icon">
                <i className="fas fa-feather-alt" />
              </div>
              <div>
                <h2 className="poem-panel-title font-rozha" style={{ margin: 0 }}>
                  मेरी रचनाएँ{' '}
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({poems.length})
                  </span>
                </h2>
              </div>
            </div>

            <div className="profile-rachnaye-actions">
              {/* Search input for user's poems */}
              {poems.length > 0 && (
                <div className="profile-rachnaye-search">
                  <i className="fas fa-search profile-rachnaye-search-icon" />
                  <input
                    type="text"
                    placeholder="अपनी रचनाओं में खोजें..."
                    value={searchRachnaye}
                    onChange={(e) => setSearchRachnaye(e.target.value)}
                  />
                  {searchRachnaye && (
                    <button
                      type="button"
                      className="profile-rachnaye-clear-icon"
                      onClick={() => setSearchRachnaye('')}
                      aria-label="खोज साफ़ करें"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              )}

              <Link href="/publish" className="primary-btn profile-new-poem-btn">
                <i className="fas fa-plus" /> नई रचना
              </Link>
            </div>
          </div>

          {/* Category Filter Chips if multiple exist */}
          {availableCategories.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                सभी ({poems.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat} ({poems.filter((p) => p.category === cat).length})
                </button>
              ))}
            </div>
          )}

          {/* Poems list */}
          {poems.length === 0 ? (
            <div className="profile-empty-state">
              <div className="profile-empty-icon-wrap">
                <i className="fas fa-pen-nib" />
              </div>
              <h3 className="profile-empty-title font-rozha">अभी कोई रचना नहीं है</h3>
              <p className="profile-empty-text font-tiro">
                अपनी पहली रचना प्रकाशित करें और अपनी भावनाओं को साहित्य का रूप दें।
              </p>
              <Link href="/publish" className="primary-btn profile-empty-cta">
                <i className="fas fa-feather-alt" /> लेखन प्रारम्भ करें
              </Link>
            </div>
          ) : filteredPoems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-search" style={{ fontSize: '2rem', opacity: 0.4, marginBottom: '0.8rem', display: 'block' }} />
              <p className="font-tiro">खोज से मेल खाती कोई रचना नहीं मिली।</p>
              <button
                type="button"
                className="secondary-btn"
                style={{ marginTop: '0.8rem' }}
                onClick={() => {
                  setSearchRachnaye('');
                  setCategoryFilter('all');
                }}
              >
                फ़िल्टर हटाएँ
              </button>
            </div>
          ) : (
            <div className="profile-poem-list">
              {filteredPoems.map((poem) => (
                <div className="poem-card-item" key={poem._id} style={{ opacity: 1 }}>
                  <div className="poem-card-info">
                    <Link
                      href={`/poem/${poem.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3 className="profile-poem-title" style={{ cursor: 'pointer' }}>
                        {poem.title}
                      </h3>
                    </Link>
                    <p className="profile-poem-excerpt font-tiro">
                      {(poem.body || '').replace(/\n+/g, ' ').trim()}
                    </p>
                    <p className="profile-poem-meta">
                      <span className="profile-poem-cat">{poem.category || 'साहित्य'}</span>
                      <span className="profile-poem-dot">·</span>
                      <span>{formatDate(poem.createdAt)}</span>
                    </p>
                  </div>

                  <div className="poem-card-actions">
                    <Link
                      href={`/poem/${poem.slug}`}
                      className="action"
                      aria-label={`${poem.title} पढ़ें`}
                      title="रचना पढ़ें"
                    >
                      <i className="far fa-eye" />
                    </Link>
                    <button
                      type="button"
                      className="action"
                      onClick={() => openEditPoem(poem)}
                      aria-label={`${poem.title} संपादित करें`}
                      title="रचना संपादित करें"
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      type="button"
                      className="action profile-delete-btn"
                      onClick={() => handleDeletePoem(poem._id)}
                      aria-label={`${poem.title} हटाएँ`}
                      title="रचना हटाएँ"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="modal-mask" onClick={() => setEditModal(false)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header-row">
              <h2 className="modal-title font-rozha">प्रोफ़ाइल संपादित करें</h2>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setEditModal(false)}
                aria-label="बंद करें"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Photo Upload Section inside Modal */}
            <div className="photo-upload-container">
              <input
                type="file"
                ref={modalPhotoInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleModalPhotoSelect}
              />
              <div className="photo-preview-box">
                {editPhotoPreview ? (
                  <img src={editPhotoPreview} alt="Preview" className="photo-preview-img" />
                ) : (
                  <i className="fas fa-user" style={{ fontSize: '2rem', color: 'var(--accent)' }} />
                )}
              </div>
              <div className="photo-upload-actions">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-dark)' }}>
                  प्रोफ़ाइल फ़ोटो
                </span>
                <button
                  type="button"
                  className="photo-file-btn"
                  onClick={() => modalPhotoInputRef.current?.click()}
                >
                  <i className="fas fa-upload" /> नई फ़ोटो चुनें
                </button>
                {editPhotoPreview && (
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => setEditPhotoPreview('')}
                  >
                    फ़ोटो हटाएँ
                  </button>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="modal-grid-2col">
              <div className="modal-field">
                <label className="modal-label">प्रथम नाम</label>
                <input
                  className="form-input"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="उदा. भारत"
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">अंतिम नाम</label>
                <input
                  className="form-input"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="उदा. भूषण"
                />
              </div>
            </div>

            {/* City & Gender */}
            <div className="modal-grid-2col">
              <div className="modal-field">
                <label className="modal-label">शहर / नगर</label>
                <input
                  className="form-input"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="उदा. दिल्ली, मुंबई"
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">लिंग</label>
                <select
                  className="form-input"
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="male">पुरुष (Male)</option>
                  <option value="female">महिला (Female)</option>
                  <option value="other">अन्य (Other)</option>
                </select>
              </div>
            </div>

            {/* Language Preference */}
            <div className="modal-field">
              <label className="modal-label">भाषा प्राथमिकता</label>
              <select
                className="form-input"
                value={editLanguagePref}
                onChange={(e) => setEditLanguagePref(e.target.value)}
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ur">उर्दू (Urdu)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Bio */}
            <div className="modal-field">
              <label className="modal-label">परिचय / आत्म-वर्णन</label>
              <textarea
                className="form-input modal-textarea"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="अपने बारे में कुछ अल्फ़ाज़ लिखें (उदा. Founder, कवि, ग़ज़लकार)..."
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setEditModal(false)}
                disabled={savingProfile}
              >
                रद्द करें
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> सहेजा जा रहा है...
                  </>
                ) : (
                  'सहेजें'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Poem Modal */}
      {editPoemModal && (
        <div className="modal-mask" onClick={() => setEditPoemModal(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header-row">
              <h2 className="modal-title font-rozha">रचना संपादित करें</h2>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setEditPoemModal(null)}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="modal-field">
              <label className="modal-label">शीर्षक</label>
              <input
                className="form-input"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
                placeholder="रचना का शीर्षक"
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">श्रेणी</label>
              <select
                className="form-input"
                value={poemCategory}
                onChange={(e) => setPoemCategory(e.target.value)}
              >
                <option value="कविता">कविता (Poem)</option>
                <option value="ग़ज़ल">ग़ज़ल (Ghazal)</option>
                <option value="शायरी">शायरी (Shayari)</option>
                <option value="नज़्म">नज़्म (Nazm)</option>
                <option value="दोहे">दोहे (Dohe)</option>
                <option value="गीत">गीत (Geet)</option>
                <option value="अन्य">अन्य</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-label">रचना पाठ (Poem Body)</label>
              <textarea
                className="form-input modal-textarea font-tiro"
                style={{ minHeight: '160px', lineHeight: 1.8 }}
                value={poemBody}
                onChange={(e) => setPoemBody(e.target.value)}
                placeholder="यहाँ अपनी रचना लिखें..."
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setEditPoemModal(null)}
                disabled={savingPoem}
              >
                रद्द करें
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleSavePoem}
                disabled={savingPoem}
              >
                {savingPoem ? 'सहेजा जा रहा है...' : 'सहेजें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Poem Modal */}
      {viewPoemModal && (
        <div className="modal-mask" onClick={() => setViewPoemModal(null)}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="modal-header-row">
              <h2 className="modal-title font-rozha">{viewPoemModal.title}</h2>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setViewPoemModal(null)}
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-field">
              <p
                className="font-tiro"
                style={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.8,
                  fontSize: '1.05rem',
                  color: 'var(--text-dark)',
                  background: '#faf6f2',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--border-light)',
                }}
              >
                {viewPoemModal.body}
              </p>
            </div>
            <div className="modal-actions">
              <Link href={`/poem/${viewPoemModal.slug}`} className="primary-btn">
                पूर्ण पृष्ठ देखें
              </Link>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setViewPoemModal(null)}
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

