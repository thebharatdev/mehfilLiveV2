'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL, Writer, Poem, formatDate } from '@/lib/mehfil';
import { useToast } from '@/components/site/ToastProvider';

function getLanguageLabel(langPref?: string): string {
  if (!langPref) return 'हिंदी / उर्दू';
  const langs: Record<string, string> = {
    hindi: 'हिंदी',
    urdu: 'उर्दू',
    english: 'अंग्रेज़ी',
    bilingual: 'द्विभाषी',
  };
  return langs[langPref.toLowerCase()] || langPref;
}

function AuthorContent() {
  const searchParams = useSearchParams();
  const authorId = searchParams.get('id');
  const { showToast } = useToast();
  const [author, setAuthor] = useState<Writer | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authorId) return;
    fetch(`${API_BASE_URL}/api/auth/user/${authorId}`)
      .then((r) => r.json())
      .then((data) => {
        setAuthor(data.user || null);
        setPoems(data.poems || data.user?.poems || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authorId]);

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
  }, [loading, poems]);

  const filteredPoems = poems.filter(
    (p) =>
      search.trim() === '' ||
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.body || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = async () => {
    const url = window.location.href;
    const fullName = `${author?.firstName || ''} ${author?.lastName || ''}`.trim();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${fullName} | Mehfil Poetry`, text: `${fullName} की रचनाएँ पढ़ें`, url });
      } catch {
        navigator.clipboard?.writeText(url);
        showToast('🔗 प्रोफ़ाइल लिंक कॉपी हो गया! अब साझा करें');
      }
    } else {
      navigator.clipboard?.writeText(url);
      showToast('🔗 प्रोफ़ाइल लिंक कॉपी हो गया! अब साझा करें');
    }
  };

  if (loading) {
    return (
      <main className="mehfil-container" style={{ padding: '2rem 0 4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', width: '100%' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255, 253, 248, 0.9)', backdropFilter: 'blur(8px)', padding: '3rem 3.5rem', borderRadius: '3rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 22, height: 22, background: '#e0a87c', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
              <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
              <div style={{ width: 22, height: 22, background: 'var(--accent-dark)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both' }} />
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', letterSpacing: '1px', background: 'linear-gradient(120deg, #c16a4b, #e4a482)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, marginBottom: 12 }}>
              रचनाकार की दुनिया में आपका स्वागत है...
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="fas fa-feather-alt" style={{ animation: 'featherSwayPoets 1.8s infinite' }} />
              कृपया प्रतीक्षा करें
              <i className="fas fa-spinner fa-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!author) {
    return (
      <main className="mehfil-container" style={{ padding: '2rem 0 4rem' }}>
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 250, 240, 0.8)', borderRadius: '2rem' }}>
          <i className="fas fa-user-slash" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.6, marginBottom: '1rem' }} />
          <h3 style={{ fontFamily: 'Cormorant Garamond', margin: '1rem 0', fontSize: '1.8rem', color: 'var(--accent-dark)' }}>
            😢 रचनाकार नहीं मिला | यह कलम अब यहाँ विराजमान नहीं है
          </h3>
          <Link href="/poems" className="back-link" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            <i className="fas fa-arrow-left" /> वापस कविताओं पर जाएँ
          </Link>
        </div>
      </main>
    );
  }

  const fullName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'अनाम रचनाकार';
  const profilePic = author.profilePic || 'https://res.cloudinary.com/djdvpnrnf/image/upload/v1780752284/profilePic_roaig0.png';
  const memberSince = formatDate(author.createdAt);
  const langPref = getLanguageLabel(author.languagePref);
  const poemsCount = (author as unknown as { poemsCount?: number }).poemsCount || poems.length || 0;
  const bioText = author.bio || 'शब्दों का मुसाफ़िर, एहसासों का हमसफ़र।';

  return (
    <main className="mehfil-container" style={{ padding: '2rem 0 4rem' }}>
      <Link href="/poems" className="back-link fade-up">
        <i className="fas fa-arrow-left" /> सभी कविताएँ
      </Link>

      {/* Hero Profile Card */}
      <div className="hero-card author-hero-card fade-up" style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(2px)',
        borderRadius: '2rem',
        border: '1px solid var(--border-light)',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'center',
      }}>
        <img
          src={profilePic}
          alt={fullName}
          style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent)', margin: '0 auto 1.2rem', background: '#efe0d2', display: 'block' }}
        />
        <h1 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-dark)', marginBottom: '0.5rem' }}>
          {fullName}
        </h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(193, 106, 75, 0.08)', padding: '0.3rem 1rem', borderRadius: 40, maxWidth: '100%', wordBreak: 'break-all' }}>
          <i className="far fa-envelope" /> {author.email || 'alumni@mehfil.com'}
        </div>
        <br />
        <button
          onClick={handleShare}
          style={{
            background: 'var(--accent)', border: 'none', padding: '0.7rem 1.5rem',
            borderRadius: 60, color: 'white', fontWeight: 600, cursor: 'pointer',
            transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: '0.5rem',
          }}
        >
          <i className="fas fa-share-alt" /> प्रोफ़ाइल साझा करें
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-light)', transition: '0.25s' }}>
          <i className="fas fa-book-open" style={{ fontSize: '2.2rem', color: 'var(--accent)', marginBottom: '0.8rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Cormorant Garamond', color: 'var(--accent-dark)' }}>{poemsCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>कुल रचनाएँ</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-light)', transition: '0.25s' }}>
          <i className="fas fa-language" style={{ fontSize: '2.2rem', color: 'var(--accent)', marginBottom: '0.8rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Cormorant Garamond', color: 'var(--accent-dark)' }}>{langPref}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>भाषा प्राथमिकता</div>
        </div>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border-light)', transition: '0.25s' }}>
          <i className="fas fa-calendar-plus" style={{ fontSize: '2.2rem', color: 'var(--accent)', marginBottom: '0.8rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Cormorant Garamond', color: 'var(--accent-dark)' }}>{memberSince}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>सदस्यता</div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bio-section fade-up" style={{ background: 'rgba(255, 250, 240, 0.7)', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--accent)', fontStyle: 'italic', color: 'var(--text-dark)', fontSize: '1rem' }}>
        <i className="fas fa-quote-left" style={{ color: 'var(--accent)', marginRight: 8 }} /> {bioText}
      </div>

      {/* Section Title */}
      <div className="fade-up author-more-title" style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', marginBottom: '1.8rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem', color: 'var(--accent-dark)' }}>
        <i className="fas fa-feather-alt" style={{ color: 'var(--accent)', marginRight: 12 }} />
        इस रचनाकार की रचनाएँ
      </div>

      {/* Search Bar */}
      <div className="fade-up" style={{ marginBottom: '2rem', position: 'relative' }}>
        <i className="fas fa-search" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="author-search-input"
          placeholder="शीर्षक या कविता के अंश से खोजें..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: 60, border: '1px solid var(--border-light)', background: 'white', fontFamily: 'inherit', fontSize: '0.9rem', transition: '0.2s', outline: 'none' }}
        />
      </div>

      {/* Poems Grid */}
      {filteredPoems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255, 250, 240, 0.8)', borderRadius: '2rem' }}>
          <i className="fas fa-leaf" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.6, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>😢 अभी तक कोई रचना प्रकाशित नहीं हुई।</p>
        </div>
      ) : (
        <div className="author-poems-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.8rem' }}>
          {filteredPoems.map((poem) => (
            <Link
              href={`/poem/${poem.slug}`}
              key={poem._id}
              className="poem-card author-poem-card fade-up"
              style={{
                background: 'white', borderRadius: '1.5rem', padding: '1.5rem',
                transition: '0.25s', border: '1px solid var(--border-light)',
                cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block',
              }}
            >
              <h3 style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--accent-dark)' }}>
                {poem.title || 'अनामिका'}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'capitalize', display: 'inline-block', background: '#f5e6dd', padding: '0.2rem 0.8rem', borderRadius: 40, marginBottom: '0.8rem' }}>
                <i className="fas fa-tag" /> {poem.category || 'कविता'}
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {(poem.body || '').substring(0, 120)}{(poem.body || '').length > 120 ? '...' : ''}
              </p>
              <div style={{ fontSize: '0.7rem', color: '#b29b88', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="far fa-calendar-alt" /> {formatDate(poem.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default function AuthorPage() {
  return (
    <Suspense fallback={
      <main className="mehfil-container" style={{ padding: '2rem 0 4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', width: '100%' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255, 253, 248, 0.9)', backdropFilter: 'blur(8px)', padding: '3rem 3.5rem', borderRadius: '3rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 22, height: 22, background: '#e0a87c', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
              <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
              <div style={{ width: 22, height: 22, background: 'var(--accent-dark)', borderRadius: '50%', animation: 'inkFlowPoets 1.4s infinite ease-in-out both' }} />
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', letterSpacing: '1px', background: 'linear-gradient(120deg, #c16a4b, #e4a482)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, marginBottom: 12 }}>
              रचनाकार की दुनिया में आपका स्वागत है...
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="fas fa-feather-alt" style={{ animation: 'featherSwayPoets 1.8s infinite' }} />
              कृपया प्रतीक्षा करें
              <i className="fas fa-spinner fa-pulse" />
            </div>
          </div>
        </div>
      </main>
    }>
      <AuthorContent />
    </Suspense>
  );
}
