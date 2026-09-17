'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from '@/lib/navigation';
import { useSearchParams } from '@/lib/navigation';
import { API_BASE_URL, Writer, Poem, formatDate } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';

function getLanguageLabel(langPref?: string): string {
  if (!langPref) return 'हिंदी / उर्दू';
  const langs: Record<string, string> = {
    hindi: 'हिंदी साहित्य',
    hi: 'हिंदी साहित्य',
    urdu: 'उर्दू शायरी',
    ur: 'उर्दू शायरी',
    english: 'English Poetry',
    en: 'English Poetry',
    bilingual: 'द्विभाषी (हिंदी-उर्दू)',
  };
  return langs[langPref.toLowerCase()] || langPref;
}

function calculateReadTime(body?: string): string {
  if (!body) return '1 मिनट वाचन';
  const wordCount = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 70));
  return `${minutes} मिनट वाचन`;
}

function AuthorContent() {
  const searchParams = useSearchParams();
  const authorId = searchParams.get('id');
  const { showToast } = useToast();
  const [author, setAuthor] = useState<Writer | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (!authorId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/auth/user/${authorId}`)
      .then((r) => r.json())
      .then((data) => {
        setAuthor(data.user || null);
        setPoems(data.poems || data.user?.poems || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authorId]);

  // Extract unique categories available from author's poems
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    poems.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats);
  }, [poems]);

  // Filter poems by search and selected category
  const filteredPoems = useMemo(() => {
    return poems.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.body || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [poems, search, selectedCategory]);

  const handleShare = async () => {
    const url = window.location.href;
    const fullName = `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 'साहित्यकार';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} की साहित्यिक प्रोफ़ाइल | Mehfil`,
          text: `मेहफ़िल पर ${fullName} की कविताओं और ग़ज़लों का संग्रह पढ़ें:`,
          url,
        });
        return;
      } catch {
        /* fallback to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 प्रोफ़ाइल लिंक कॉपी हो गया! अब साझा करें');
    } catch {
      showToast('🔗 लिंक कॉपी करने के लिए URL बार से कॉपी करें');
    }
  };

  if (loading) {
    return (
      <main className="mehfil-container author-page-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255, 253, 248, 0.95)', backdropFilter: 'blur(10px)', padding: '3rem 3.5rem', borderRadius: '2.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 20, height: 20, background: '#e0a87c', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
              <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
              <div style={{ width: 20, height: 20, background: 'var(--accent-dark)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both' }} />
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', letterSpacing: '0.5px', color: 'var(--accent-dark)', fontWeight: 700, marginBottom: 10 }}>
              रचनाकार की साहित्यिक दुनिया खुल रही है...
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="fas fa-feather-alt" style={{ animation: 'featherSwayPoets 1.8s infinite', color: 'var(--accent)' }} />
              कृपया प्रतीक्षा करें
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!author) {
    return (
      <main className="mehfil-container author-page-wrap">
        <div className="author-empty-state">
          <div className="author-empty-icon">
            <i className="fas fa-user-slash" />
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: 'var(--accent-dark)', marginBottom: '0.75rem' }}>
            रचनाकार नहीं मिले
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            यह रचनाकार प्रोफ़ाइल उपलब्ध नहीं है या हटा दी गई है। आप अन्य कलमकारों की कविताएँ और ग़ज़लें पढ़ सकते हैं।
          </p>
          <Link href="/poems" className="author-action-btn-primary">
            <i className="fas fa-arrow-left" /> सभी कविताओं पर लौटें
          </Link>
        </div>
      </main>
    );
  }

  const fullName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'अनाम साहित्यकार';
  const initials = (author.firstName || 'म').charAt(0).toUpperCase();
  const profilePic = author.profilePic;
  const memberSince = author.createdAt ? formatDate(author.createdAt) : '2026';
  const langPref = getLanguageLabel(author.languagePref);
  const poemsCount = (author as unknown as { poemsCount?: number }).poemsCount || poems.length || 0;
  const bioText = author.bio?.trim() || 'शब्दों का मुसाफ़िर, एहसासों का हमसफ़र। कलम से दिल की बात बयां करना ही मेरी इबादत है।';

  return (
    <main className="mehfil-container author-page-wrap">
      {/* Top Breadcrumb & Share Bar */}
      <div className="author-top-bar">
        <Link href="/poems" className="author-back-btn">
          <i className="fas fa-arrow-left" /> सभी कविताएँ
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="author-action-btn-secondary"
          style={{ padding: '8px 18px', fontSize: '0.84rem' }}
          title="प्रोफ़ाइल लिंक साझा करें"
        >
          <i className="fas fa-share-alt" style={{ color: 'var(--accent)' }} /> साझा करें
        </button>
      </div>

      {/* Hero Profile Card */}
      <section className="author-profile-hero" aria-label="रचनाकार का परिचय">
        {/* Cover Art Banner */}
        <div className="author-cover">
          <div className="author-cover-pattern">✦ अ क म ह र स · शब्द और अहसास · मेहफ़िल ✦</div>
          <div className="author-cover-overlay" />
          <div className="author-cover-deco author-cover-deco-1">❦</div>
          <div className="author-cover-deco author-cover-deco-2">✿</div>
        </div>

        {/* Hero Body */}
        <div className="author-hero-body">
          <div className="author-hero-main">
            {/* Dual Ring Avatar */}
            <div className="author-avatar-wrap">
              <div className="author-avatar-ring">
                {profilePic && !avatarError ? (
                  <img
                    src={profilePic}
                    alt={fullName}
                    className="author-avatar-img"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="author-avatar-placeholder">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {/* Author Identity & Metadata */}
            <div className="author-hero-details">
              <div className="author-name-row">
                <h1 className="author-name">{fullName}</h1>
                <span className="author-badge-verified">
                  <i className="fas fa-feather-alt" style={{ color: '#d97706' }} />
                  {author.role === 'admin' ? 'प्रधान संपादक' : 'साहित्यकार'}
                </span>
              </div>

              {/* Tag Pills */}
              <div className="author-tags-row">
                <span className="author-tag-pill">
                  <i className="fas fa-language" /> {langPref}
                </span>
                {author.city && (
                  <span className="author-tag-pill">
                    <i className="fas fa-map-marker-alt" /> {author.city}
                  </span>
                )}
                <span className="author-tag-pill">
                  <i className="far fa-calendar-alt" /> सदस्य: {memberSince}
                </span>
                <span className="author-tag-pill">
                  <i className="fas fa-book-open" /> {poemsCount} रचनाएँ
                </span>
              </div>

              {/* Literary Bio Quote */}
              <div className="author-bio-card">
                <i className="fas fa-quote-left quote-icon" />
                <span>{bioText}</span>
              </div>

              {/* Action Buttons */}
              <div className="author-actions-row">
                <a href="#author-works" className="author-action-btn-primary">
                  <i className="fas fa-book-reader" /> रचनाएँ पढ़ें ({poemsCount})
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="author-action-btn-secondary"
                >
                  <i className="fas fa-share-alt" /> प्रोफ़ाइल साझा करें
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="author-stats-row" aria-label="साहित्यिक आंकड़े">
        <div className="author-stat-card">
          <div className="author-stat-icon-wrap">
            <i className="fas fa-feather-alt" />
          </div>
          <div className="author-stat-num">{poemsCount}</div>
          <div className="author-stat-label">कुल प्रकाशित रचनाएँ</div>
        </div>

        <div className="author-stat-card">
          <div className="author-stat-icon-wrap">
            <i className="fas fa-layer-group" />
          </div>
          <div className="author-stat-num">{availableCategories.length || 1}</div>
          <div className="author-stat-label">साहित्यिक विधाएँ</div>
        </div>

        <div className="author-stat-card">
          <div className="author-stat-icon-wrap">
            <i className="fas fa-language" />
          </div>
          <div className="author-stat-num" style={{ fontSize: '1.35rem' }}>
            {author.languagePref ? getLanguageLabel(author.languagePref).split(' ')[0] : 'हिंदी'}
          </div>
          <div className="author-stat-label">मुख्य अभिव्यक्ति माध्यम</div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="author-works" className="author-portfolio-section" aria-label="रचनाकार का साहित्य संसार">
        <div className="author-portfolio-header">
          <h2 className="author-portfolio-title">
            <i className="fas fa-book-open" />
            <span>रचनाकार का साहित्य संसार</span>
          </h2>
          <span className="author-count-badge">
            {filteredPoems.length} {filteredPoems.length === 1 ? 'रचना उपलब्ध' : 'रचनाएँ उपलब्ध'}
          </span>
        </div>

        {/* Toolbar: Search and Category Pills */}
        <div className="author-toolbar">
          <div className="author-search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              className="author-search-input"
              placeholder="शीर्षक, श्रेणी या कविता की पंक्तियों से खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="रचनाकार की रचनाएँ खोजें"
            />
          </div>

          {availableCategories.length > 0 && (
            <div className="author-category-chips">
              <button
                type="button"
                className={`author-chip ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                सभी रचनाएँ ({poems.length})
              </button>
              {availableCategories.map((cat) => {
                const count = poems.filter(
                  (p) => (p.category || '').toLowerCase() === cat.toLowerCase()
                ).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`author-chip ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Poems Grid */}
        {filteredPoems.length === 0 ? (
          <div className="author-empty-state">
            <div className="author-empty-icon">
              <i className="fas fa-feather" />
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.7rem', color: 'var(--accent-dark)', marginBottom: '0.5rem' }}>
              {search || selectedCategory !== 'all'
                ? 'कोई रचना नहीं मिली'
                : 'अभी तक कोई रचना प्रकाशित नहीं हुई'}
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
              {search || selectedCategory !== 'all'
                ? 'आपकी खोज अथवा चुने गए फ़िल्टर के अनुसार कोई रचना उपलब्ध नहीं है। कृपया फ़िल्टर बदल कर देखें।'
                : 'इस रचनाकार ने अभी तक कोई रचना साझा नहीं की है। जल्द ही नई पंक्तियाँ यहाँ दिखाई देंगी।'}
            </p>
            {(search || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                className="author-action-btn-secondary"
              >
                फ़िल्टर साफ़ करें
              </button>
            )}
          </div>
        ) : (
          <div className="author-poems-grid">
            {filteredPoems.map((poem) => {
              const readTime = calculateReadTime(poem.body);
              const previewText = (poem.body || '').replace(/\n+/g, ' ').trim();

              return (
                <Link
                  href={`/poem/${poem.slug}`}
                  key={poem._id}
                  className="author-poem-card"
                >
                  <div className="author-poem-top">
                    <span className="author-poem-mood">
                      <i className="fas fa-bookmark" style={{ fontSize: '0.7rem' }} />
                      {poem.category || 'साहित्य'}
                    </span>
                    <span className="author-poem-readtime">
                      <i className="far fa-clock" /> {readTime}
                    </span>
                  </div>

                  <h3 className="author-poem-title">
                    {poem.title || 'अनाम रचना'}
                  </h3>

                  <p className="author-poem-snippet">
                    {previewText || 'शब्दों का एक शांत प्रवाह...'}
                  </p>

                  <div className="author-poem-footer">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className="far fa-calendar-alt" /> {formatDate(poem.createdAt)}
                    </span>
                    <span className="read-action">
                      पूरी रचना पढ़ें <i className="fas fa-arrow-right" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function AuthorPage() {
  return (
    <Suspense
      fallback={
        <main className="mehfil-container author-page-wrap">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255, 253, 248, 0.95)', backdropFilter: 'blur(10px)', padding: '3rem 3.5rem', borderRadius: '2.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 20, height: 20, background: '#e0a87c', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
                <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
                <div style={{ width: 20, height: 20, background: 'var(--accent-dark)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both' }} />
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--accent-dark)', fontWeight: 700, marginBottom: 10 }}>
                रचनाकार की दुनिया सज रही है...
              </div>
            </div>
          </div>
        </main>
      }
    >
      <AuthorContent />
    </Suspense>
  );
}

