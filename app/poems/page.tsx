'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { API_BASE_URL, Poem } from '@/lib/mehfil';

const MOODS = ['all', 'love', 'sad', 'motivation', 'nature', 'shayari'];
const MOOD_ICONS: Record<string, string> = {
  Love: '❤️', Sad: '🌧', Motivation: '✨', Nature: '🍃', Life: '🌙', Sufi: '☪', Friendship: '🤝', Shayari: '🖋',
};

export default function PoemsPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mood, setMood] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 16;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/poems`)
      .then((r) => r.json())
      .then((data) => {
        setPoems(data.poems || data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = poems;
    if (mood !== 'all') {
      result = result.filter((p) => (p.category || '').toLowerCase() === mood);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.body || '').toLowerCase().includes(q) ||
          (p.author?.firstName || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [poems, mood, search]);

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
          <div className="filter-bar">
            <div className="filter-search">
              <i className="fas fa-search" style={{ marginRight: '10px', color: '#b8a092' }} />
              <input
                type="text"
                placeholder="कविता, कवि या शब्द खोजें..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="filter-chips">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`filter-chip ${mood === m ? 'active' : ''}`}
                  onClick={() => { setMood(m); setPage(1); }}
                >
                  {m === 'all' ? 'सभी' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loader-wrapper">
              <div className="loader-dots"><span></span><span></span><span></span></div>
              <div className="loader-text">अल्फ़ाज़ आ रहे हैं...</div>
            </div>
          ) : pageItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              ✨ कोई रचनाएँ नहीं मिलीं।
            </p>
          ) : (
            <div className="poems-list-grid">
              {pageItems.map((poem) => (
                <Link href={`/poem/${poem.slug}`} key={poem._id} className="poem-card">
                  <div className="poem-card-header">
                    <div className="card-top-icon">{MOOD_ICONS[poem.category || ''] || '❤️'}</div>
                    <span className="mood">{poem.category || 'अन्य'}</span>
                  </div>
                  <h3>{poem.title}</h3>
                  <p>{(poem.body || '').substring(0, 120)}...</p>
                  <div className="poem-footer">
                    <span>By {poem.author?.firstName || 'अज्ञात'}</span>
                    <span>3 min read</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '3rem' }}>
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
