'use client';

import { useEffect, useState, useMemo, useRef, useDeferredValue } from 'react';
import Link from '@/lib/navigation';
import { API_BASE_URL, Poem, formatDate } from '@/lib/mehfil';
import { indexPoems, searchIndexedPoems } from '@/lib/search';

const MOODS = ['all', 'love', 'sad', 'motivation', 'nature', 'shayari', 'nazm'];
const MOOD_LABELS: Record<string, string> = {
  all: 'सभी',
  love: 'प्रेम (Love)',
  sad: 'दर्द (Sad)',
  motivation: 'प्रेरणा (Motivation)',
  nature: 'प्रकृति (Nature)',
  shayari: 'शायरी / ग़ज़ल',
  nazm: 'नज़्म',
};
const MOOD_ICONS: Record<string, string> = {
  Love: '❤️', Sad: '🌧', Motivation: '✨', Nature: '🍃', Life: '🌙', Sufi: '☪', Friendship: '🤝', Shayari: '🖋', 'नज़्म': '📜', 'ग़ज़ल': '🖋', 'कविता': '🌸', 'दुआ': '🤲',
};

export default function PoemsPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mood, setMood] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 16;
  const wotwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/poems`)
      .then((r) => r.json())
      .then((data) => {
        setPoems(data.poems || data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
  }, [loading, search, mood, page]);

  const poemOfTheWeek = useMemo(() => {
    if (!poems.length) return null;
    return poems[0];
  }, [poems]);

  // Non-blocking responsive search value for smooth 60fps typing
  const deferredSearch = useDeferredValue(search);

  // Pre-index poems once on load; subsequent searches run in <0.3ms
  const indexedPoems = useMemo(() => {
    return indexPoems(poems);
  }, [poems]);

  // Check category match with synonym tolerance
  const matchesMoodCategory = (p: Poem, targetMood: string) => {
    if (targetMood === 'all') return true;
    const cat = (p.category || '').toLowerCase().trim();
    if (cat === targetMood) return true;
    if (targetMood === 'shayari' && (cat === 'ग़ज़ल' || cat === 'ghazal' || cat === 'शेर' || cat === 'दोहा' || cat === 'doha')) return true;
    if (targetMood === 'nazm' && (cat === 'नज़्म' || cat === 'दुआ' || cat === 'तराना')) return true;
    if (targetMood === 'love' && (cat === 'प्रेम' || cat === 'इश्क़' || cat === 'love')) return true;
    if (targetMood === 'sad' && (cat === 'दर्द' || cat === 'उदासी' || cat === 'sad')) return true;
    if (targetMood === 'motivation' && (cat === 'प्रेरणा' || cat === 'उत्साह' || cat === 'motivation')) return true;
    if (targetMood === 'nature' && (cat === 'प्रकृति' || cat === 'nature')) return true;
    return false;
  };

  // Single-pass search (<0.3ms) providing both filtered results and global cross-category count
  const { filtered, globalMatchesCount } = useMemo(() => {
    const trimmed = deferredSearch.trim();
    if (!trimmed) {
      const list = mood === 'all' ? poems : poems.filter((p) => matchesMoodCategory(p, mood));
      return { filtered: list, globalMatchesCount: 0 };
    }

    const allMatches = searchIndexedPoems(indexedPoems, trimmed);
    const globalCount = allMatches.length;

    let categoryMatches = allMatches;
    if (mood !== 'all') {
      categoryMatches = allMatches.filter(({ poem }) => matchesMoodCategory(poem, mood));
    }

    return {
      filtered: categoryMatches.map((x) => x.poem),
      globalMatchesCount: globalCount,
    };
  }, [indexedPoems, poems, deferredSearch, mood]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="page-header">
        <h1>कविताएँ</h1>
        <p>हिंदी और उर्दू की बेहतरीन रचनाएँ एक ही जगह</p>
      </div>

      <section style={{ paddingTop: 0 }}>
        <div className="mehfil-container">
          {/* Poem of the Week - Only show when not searching to keep focus on search results */}
          {!loading && poemOfTheWeek && !search.trim() && mood === 'all' && (
            <div className="potw-section fade-up" ref={wotwRef}>
              <div className="potw-card">
                <div className="potw-shimmer" />
                <div className="potw-decoration potw-decoration-left">❋</div>
                <div className="potw-decoration potw-decoration-right">❀</div>

                <div className="potw-badge">
                  <i className="fas fa-crown" />
                  <span>सप्ताह की रचना</span>
                  <i className="fas fa-crown" />
                </div>

                <div className="potw-content">
                  <div className="potw-meta-row">
                    <span className="potw-category">
                      {MOOD_ICONS[poemOfTheWeek.category || ''] || '❤️'} {poemOfTheWeek.category || 'अन्य'}
                    </span>
                    <span className="potw-date">
                      <i className="far fa-calendar-alt" /> {formatDate(poemOfTheWeek.createdAt)}
                    </span>
                  </div>

                  <h2 className="potw-title">{poemOfTheWeek.title}</h2>

                  <div className="potw-author">
                    <div className="potw-author-avatar">
                      {poemOfTheWeek.author?.profilePic ? (
                        <img src={poemOfTheWeek.author.profilePic} alt="" />
                      ) : (
                        <span>{(poemOfTheWeek.author?.firstName || 'A').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="potw-author-name">
                      {poemOfTheWeek.author?.firstName || 'अज्ञात'} {poemOfTheWeek.author?.lastName || ''}
                    </span>
                  </div>

                  <div className="potw-body">
                    <i className="fas fa-quote-left potw-quote-icon" />
                    <p>{(poemOfTheWeek.body || '').substring(0, 280)}{(poemOfTheWeek.body || '').length > 280 ? '...' : ''}</p>
                  </div>

                  <div className="potw-actions">
                    <Link href={`/poem/${poemOfTheWeek.slug}`} className="potw-read-btn">
                      <i className="fas fa-book-reader" /> सम्पूर्ण पढ़ें
                    </Link>
                    <button
                      className="potw-share-btn"
                      onClick={() => {
                        const url = `${window.location.origin}/poem/${poemOfTheWeek.slug}`;
                        if (navigator.share) {
                          navigator.share({ title: poemOfTheWeek.title, url }).catch(() => {});
                        } else {
                          navigator.clipboard?.writeText(url);
                        }
                      }}
                    >
                      <i className="fas fa-share-alt" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="filter-bar">
            <div className="filter-search">
              <i className="fas fa-search" style={{ marginRight: '10px', color: '#b8a092' }} />
              <input
                type="text"
                placeholder="कविता, कवि या शब्द खोजें... (उदा. एक पहाड़, राहत, दिल)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => { setSearch(''); setPage(1); }}
                  aria-label="खोज साफ़ करें"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <div className="filter-chips">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`filter-chip ${mood === m ? 'active' : ''}`}
                  onClick={() => { setMood(m); setPage(1); }}
                >
                  {MOOD_LABELS[m] || (m === 'all' ? 'सभी' : m.charAt(0).toUpperCase() + m.slice(1))}
                </button>
              ))}
            </div>
          </div>

          {search.trim() && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                background: '#faf6f2',
                borderRadius: '1rem',
                border: '1px solid var(--border-light)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>
                  खोज परिणाम: &ldquo;{search}&rdquo;
                </span>
                <span style={{ marginLeft: '0.6rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  ({filtered.length} {filtered.length === 1 ? 'रचना मिली' : 'रचनाएँ मिलीं'})
                </span>
              </div>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => { setSearch(''); setPage(1); }}
              >
                <i className="fas fa-times" /> खोज साफ़ करें
              </button>
            </div>
          )}

          {loading ? (
            <div className="loader-wrapper">
              <div className="loader-dots"><span></span><span></span><span></span></div>
              <div className="loader-text">अल्फ़ाज़ आ रहे हैं...</div>
            </div>
          ) : pageItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3.5rem 1.5rem' }}>
              <i className="fas fa-search" style={{ fontSize: '2.4rem', opacity: 0.35, marginBottom: '1rem', display: 'block', color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-dark)', marginBottom: '0.5rem', fontWeight: 600 }}>
                {search ? `‘${search}’ के लिए कोई रचना नहीं मिली` : 'कोई रचनाएँ नहीं मिलीं'}
              </h3>
              {mood !== 'all' && globalMatchesCount > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.92rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    चयनित श्रेणी &lsquo;{MOOD_LABELS[mood] || mood}&rsquo; में कोई मेल नहीं मिला, लेकिन अन्य श्रेणियों में <strong>{globalMatchesCount}</strong> रचनाएँ उपलब्ध हैं।
                  </p>
                  <button
                    className="primary-btn"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.4rem' }}
                    onClick={() => { setMood('all'); setPage(1); }}
                  >
                    सभी श्रेणियों में परिणाम देखें ({globalMatchesCount})
                  </button>
                </div>
              ) : search ? (
                <div>
                  <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0.4rem auto 1.2rem', lineHeight: 1.6 }}>
                    कृपया वर्तनी (spelling) जांचें, या कवि के नाम / शीर्षक के किसी अन्य शब्द से खोजें।
                  </p>
                  <button
                    className="secondary-btn"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
                    onClick={() => { setSearch(''); setMood('all'); setPage(1); }}
                  >
                    <i className="fas fa-undo" style={{ marginRight: '0.4rem' }} /> सभी कविताएँ देखें
                  </button>
                </div>
              ) : (
                <button
                  className="secondary-btn"
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => { setMood('all'); setPage(1); }}
                >
                  सभी कविताएँ देखें
                </button>
              )}
            </div>
          ) : (
            <div className="poems-list-grid">
              {pageItems.map((poem) => (
                <Link href={`/poem/${poem.slug}`} key={poem._id} className="poem-card">
                  <div className="poem-card-header">
                    <div className="card-top-icon">{MOOD_ICONS[poem.category || ''] || '❤️'}</div>
                    <span className="mood">{poem.category || 'अन्य'}</span>
                  </div>
                  <h3 className="font-rozha">{poem.title}</h3>
                  <p className="font-tiro">{(poem.body || '').substring(0, 120)}...</p>
                  <div className="poem-footer">
                    <span>By {poem.author?.firstName || 'अज्ञात'}</span>
                    <span>3 min read</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination-bar">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`filter-chip ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
