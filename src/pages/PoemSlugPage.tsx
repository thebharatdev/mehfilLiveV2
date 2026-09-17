'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from '@/lib/navigation';
import { useParams, useSearchParams } from '@/lib/navigation';
import { API_BASE_URL, Poem, Writer, formatDate } from '@/lib/mehfil';
import { sharePoemImage } from '@/lib/shareImage';
import { PoemShareModal } from '@/components/PoemShareModal';
import { useToast } from '@/components/site/ToastProvider';

type FontSize = 'sm' | 'md' | 'lg' | 'xl';
type ReaderTheme = 'parchment' | 'mushaira' | 'sepia';
type ReaderFont = 'classic' | 'kalam' | 'tiro';
type ReaderAlign = 'center' | 'left';

function PoemContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || searchParams.get('slug') || '';
  const { showToast } = useToast();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [author, setAuthor] = useState<Writer | null>(null);
  const [authorPoems, setAuthorPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [theme, setTheme] = useState<ReaderTheme>('parchment');
  const [fontFamily, setFontFamily] = useState<ReaderFont>('classic');
  const [align, setAlign] = useState<ReaderAlign>('center');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE_URL}/api/poems/slug/${slug}`)
      .then((r) => r.json())
      .then(async (data) => {
        const p = data.poem || data;
        setPoem(p);
        setLikeCount(p.likes || 42);
        if (p.author?._id) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/user/${p.author._id}`);
            const d = await res.json();
            setAuthor(d.user || null);
            setAuthorPoems((d.poems || d.user?.poems || []).filter((x: Poem) => x._id !== p._id));
          } catch {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const timer = setTimeout(() => {
      document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    }, 100);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [loading, authorPoems]);

  const handleShare = () => {
    setShareModalOpen(true);
  };

  const handleCopyPoem = () => {
    if (!poem) return;
    const text = `“${poem.title}”\n\n${poem.body}\n\n— ${authorName}\nसाभार: मेहफ़िल (${window.location.href})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('📋 पूरी रचना कॉपी हो गई!');
    }
  };

  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? c + 1 : c - 1));
      showToast(next ? '❤️ दाद कुबूल हुई!' : 'दाद वापस ली गई');
      return next;
    });
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => {
      const next = !prev;
      showToast(next ? '🔖 आपकी पसंदीदा सूची में सहेजा गया' : 'पसंदीदा से हटाया गया');
      return next;
    });
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>कविता सांस ले रही है... कृपया प्रतीक्षा करें</p>
      </div>
    );
  }

  if (!poem) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 250, 240, 0.8)', borderRadius: '2rem', margin: '2rem auto', maxWidth: '600px' }}>
        <i className="fas fa-leaf" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.6, marginBottom: '1rem' }} />
        <h3 style={{ fontFamily: 'Cormorant Garamond', margin: '1rem 0', fontSize: '1.8rem', color: 'var(--accent-dark)' }}>
          😢 कविता नहीं मिली | यह रचना संसार से विदा हो चुकी है
        </h3>
        <Link href="/poems" className="back-link" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          <i className="fas fa-arrow-left" /> वापस कविताओं पर जाएँ
        </Link>
      </div>
    );
  }

  const authorName = poem.author
    ? `${poem.author.firstName || ''} ${poem.author.lastName || ''}`.trim()
    : 'अज्ञात रचनाकार';
  const authorPic =
    poem.author?.profilePic ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=C16A4B&color=fff&rounded=true&size=80`;
  const categoryDisplay = poem.category
    ? poem.category.charAt(0).toUpperCase() + poem.category.slice(1)
    : 'ग़ज़ल';

  const fontSizes: { key: FontSize; label: string }[] = [
    { key: 'sm', label: 'A-' },
    { key: 'md', label: 'A' },
    { key: 'lg', label: 'A+' },
    { key: 'xl', label: 'A++' },
  ];

  const fontFamilies: { key: ReaderFont; label: string }[] = [
    { key: 'classic', label: 'शास्त्रीय' },
    { key: 'kalam', label: 'कलम' },
    { key: 'tiro', label: 'तीरो' },
  ];

  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'kalam': return "'Kalam', cursive";
      case 'tiro': return "'Tiro Devanagari Hindi', serif";
      case 'classic':
      default:
        return "'Noto Serif Devanagari', 'Cormorant Garamond', serif";
    }
  };

  return (
    <main className="poem-main" style={{ padding: '1.5rem 0 4rem' }}>
      <div className="mehfil-container">
        {/* Navigation & Controls Bar (Fully Responsive) */}
        <div className="poem-nav-and-controls">
          <Link href="/poems" className="back-link">
            <i className="fas fa-arrow-left" />
            <span>सभी रचनाएँ</span>
          </Link>

          {/* Reader Controls Toolbar */}
          <div className="rekhta-reader-toolbar" role="toolbar" aria-label="रचना पाठक सेटिंग्स">
            {/* Theme Selector (रंग) */}
            <div className="reader-ctrl-group">
              <span className="reader-ctrl-label">
                <i className="fas fa-palette" /> रंग
              </span>
              <div className="reader-pill-group">
                <button
                  type="button"
                  className={`reader-pill-btn ${theme === 'parchment' ? 'active' : ''}`}
                  onClick={() => setTheme('parchment')}
                  title="काग़ज़ थीम (Parchment)"
                >
                  <span>📜 काग़ज़</span>
                </button>
                <button
                  type="button"
                  className={`reader-pill-btn ${theme === 'mushaira' ? 'active' : ''}`}
                  onClick={() => setTheme('mushaira')}
                  title="मुशायरा रात थीम (Mushaira Dark)"
                >
                  <span>🌙 रात</span>
                </button>
                <button
                  type="button"
                  className={`reader-pill-btn ${theme === 'sepia' ? 'active' : ''}`}
                  onClick={() => setTheme('sepia')}
                  title="विंटेज सेपिया थीम (Sepia)"
                >
                  <span>🍂 सेपिया</span>
                </button>
              </div>
            </div>

            <div className="reader-ctrl-divider" />

            {/* Font Family Selector (लिपि) */}
            <div className="reader-ctrl-group">
              <span className="reader-ctrl-label">
                <i className="fas fa-font" /> लिपि
              </span>
              <div className="reader-pill-group">
                {fontFamilies.map((ff) => (
                  <button
                    key={ff.key}
                    type="button"
                    className={`reader-pill-btn ${fontFamily === ff.key ? 'active' : ''}`}
                    onClick={() => setFontFamily(ff.key)}
                  >
                    <span>{ff.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="reader-ctrl-divider" />

            {/* Font Size (आकार) */}
            <div className="reader-ctrl-group">
              <span className="reader-ctrl-label">
                <i className="fas fa-text-height" /> आकार
              </span>
              <div className="reader-pill-group">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.key}
                    type="button"
                    className={`reader-pill-btn size-btn ${fontSize === fs.key ? 'active' : ''}`}
                    onClick={() => setFontSize(fs.key)}
                    aria-label={`फ़ॉन्ट आकार ${fs.key}`}
                  >
                    <span>{fs.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="reader-ctrl-divider" />

            {/* Alignment (संरेखण) */}
            <div className="reader-ctrl-group">
              <span className="reader-ctrl-label">
                <i className="fas fa-align-center" /> संरेखण
              </span>
              <div className="reader-pill-group">
                <button
                  type="button"
                  className={`reader-pill-btn icon-only ${align === 'center' ? 'active' : ''}`}
                  onClick={() => setAlign('center')}
                  title="मध्य संरेखण (Centered - Rekhta Couplet style)"
                >
                  <i className="fas fa-align-center" />
                </button>
                <button
                  type="button"
                  className={`reader-pill-btn icon-only ${align === 'left' ? 'active' : ''}`}
                  onClick={() => setAlign('left')}
                  title="बायाँ संरेखण (Left aligned)"
                >
                  <i className="fas fa-align-left" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reader Card with Theme Class */}
        <div className={`poem-reader-wrapper theme-${theme}`}>
          <div className="poem-detail-card fade-up">
            <span className="sher-corner-ornament sher-corner-tl">❦</span>
            <span className="sher-corner-ornament sher-corner-tr">❦</span>
            <span className="sher-corner-ornament sher-corner-bl">❦</span>
            <span className="sher-corner-ornament sher-corner-br">❦</span>

            <div style={{ textAlign: 'center', marginBottom: '1.8rem', position: 'relative', zIndex: 2 }}>
              <span className="category-badge" style={{ background: 'var(--accent-soft)', padding: '0.35rem 1.1rem', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                <i className="fas fa-feather-alt" /> {categoryDisplay}
              </span>
              <h1 className="poem-title" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, color: 'inherit', lineHeight: 1.25, margin: '0.2rem 0 0.8rem' }}>
                {poem.title || 'बेनाम रचना'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.86rem', opacity: 0.85 }}>
                {poem.author?._id ? (
                  <Link href={`/author?id=${poem.author._id}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-pen-nib" style={{ color: 'var(--accent)' }} /> {authorName}
                  </Link>
                ) : (
                  <span><i className="fas fa-pen-nib" style={{ color: 'var(--accent)' }} /> {authorName}</span>
                )}
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="far fa-calendar-alt" /> {formatDate(poem.createdAt)}
                </span>
              </div>
            </div>

            <div
              className={`poem-body fs-${fontSize}`}
              style={{
                position: 'relative',
                zIndex: 2,
                fontFamily: getFontFamilyStyle(),
                textAlign: align,
                lineHeight: 2.1,
                whiteSpace: 'pre-line',
              }}
            >
              {poem.body}
            </div>

            {/* Rekhta Centered Emblem / Footer Mark */}
            <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.6, fontSize: '1.2rem', letterSpacing: '0.5rem' }}>
              ❦ ❖ ❦
            </div>
          </div>
        </div>

        {/* Action Bar (Save, Copy, Share) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '2rem 0 3rem' }}>
          <button
            type="button"
            onClick={handleToggleSave}
            className="secondary-btn"
            style={{ padding: '10px 22px', borderRadius: '50px', fontSize: '0.9rem' }}
          >
            <i className={isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'} />
            <span>{isSaved ? 'सहेजा गया' : 'सहेजें'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPoem}
            className="secondary-btn"
            style={{ padding: '10px 22px', borderRadius: '50px', fontSize: '0.9rem' }}
          >
            <i className="fas fa-copy" />
            <span>कॉपी करें</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="primary-btn"
            style={{ padding: '10px 24px', borderRadius: '50px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-share-alt" />
            <span>साझा करें</span>
          </button>
        </div>

        {/* Author Card */}
        {poem.author?._id && (
          <Link
            href={`/author?id=${poem.author._id}`}
            className="author-card fade-up"
            style={{
              marginBottom: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              flexWrap: 'wrap',
              background: 'linear-gradient(135deg, rgba(255, 253, 248, 0.95), rgba(253, 246, 238, 0.9))',
              border: '1px solid var(--border-light)',
              borderRadius: '1.8rem',
              padding: '1.5rem 1.8rem',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img
                  className="author-avatar"
                  src={authorPic}
                  alt={authorName}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--accent)',
                    background: '#efe0d2',
                    boxShadow: '0 4px 14px rgba(184, 80, 58, 0.2)',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: 'linear-gradient(135deg, #bd8e4e, #916124)',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  border: '2px solid white',
                }}>
                  <i className="fas fa-feather-alt" />
                </span>
              </div>

              <div className="author-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: 'Noto Serif Devanagari, Cormorant Garamond, serif', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--accent-dark)' }}>
                    {authorName}
                  </h3>
                  <span style={{
                    fontSize: '0.74rem',
                    padding: '2px 10px',
                    borderRadius: '40px',
                    background: 'rgba(184, 80, 58, 0.08)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}>
                    रचनाकार
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span><i className="fas fa-pen-fancy" style={{ color: 'var(--accent)', marginRight: 5 }} />कुल रचनाएँ: {authorPoems.length + 1}</span>
                  {author?.city && <span><i className="fas fa-map-marker-alt" style={{ color: 'var(--accent)', marginRight: 4 }} />{author.city}</span>}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-dark)', fontStyle: 'italic', marginTop: '0.35rem', fontFamily: 'Tiro Devanagari Hindi, serif' }}>
                  &ldquo;{author?.bio?.trim() || 'शब्दों का मुसाफ़िर, एहसासों का हमसफ़र।'}&rdquo;
                </div>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '50px',
              background: 'white',
              border: '1px solid var(--border-light)',
              color: 'var(--accent-dark)',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
            }}>
              प्रोफ़ाइल देखें <i className="fas fa-arrow-right" style={{ color: 'var(--accent)', fontSize: '0.78rem' }} />
            </div>
          </Link>
        )}

        {/* More Poems by Same Writer */}
        {authorPoems.length > 0 && (
          <div className="more-poems fade-up" style={{ marginTop: '2rem' }}>
            <h2 className="author-more-title" style={{
              fontFamily: 'Cormorant Garamond',
              fontSize: '2rem',
              marginBottom: '1.8rem',
              borderLeft: '5px solid var(--accent)',
              paddingLeft: '1rem',
              color: 'var(--accent-dark)',
            }}>
              <i className="fas fa-book-open" style={{ color: 'var(--accent)', marginRight: '10px' }} />
              इसी रचनाकार की और कविताएँ
            </h2>
            <div className="more-poems-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.8rem',
            }}>
              {authorPoems.map((p) => (
                <Link
                  href={`/poem/${p.slug}`}
                  key={p._id}
                  className="poem-mini-card fade-up"
                  style={{
                    background: 'white',
                    borderRadius: '1.5rem',
                    padding: '1.5rem',
                    transition: '0.25s',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    display: 'block',
                    textDecoration: 'none',
                  }}
                >
                  <h4 style={{
                    fontFamily: 'Cormorant Garamond',
                    fontSize: '1.35rem',
                    marginBottom: '0.5rem',
                    color: 'var(--accent-dark)',
                  }}>
                    {p.title || 'अनामिका'}
                  </h4>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent)',
                    textTransform: 'capitalize',
                    marginBottom: '0.6rem',
                    display: 'inline-block',
                    background: '#f5e6dd',
                    padding: '0.2rem 0.8rem',
                    borderRadius: '40px',
                  }}>
                    <i className="fas fa-tag" /> {p.category || 'कविता'}
                  </span>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}>
                    {(p.body || '').substring(0, 90)}...
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <PoemShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        poem={poem}
        authorName={authorName}
        onToast={showToast}
      />
    </main>
  );
}

export default function PoemPage() {
  return (
    <Suspense fallback={
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>कविता सांस ले रही है... कृपया प्रतीक्षा करें</p>
      </div>
    }>
      <PoemContent />
    </Suspense>
  );
}
