'use client';

import { useState, Suspense } from 'react';
import Link from '@/lib/navigation';
import { CATEGORIES } from '@/lib/mehfil';

const POEMS_BY_CATEGORY: Record<string, { title: string; excerpt: string; author: string }[]> = {
  love: [
    { title: 'मोहब्बत का सफ़र', excerpt: 'तुम्हारी याद में बीती हर रात...', author: 'Ayaan' },
    { title: 'दिल की आवाज़', excerpt: 'सुनो तो मेरे दिल की...', author: 'Meera' },
  ],
  sad: [
    { title: 'तन्हाई', excerpt: 'रात की ख़ामोशी में...', author: 'Kabir' },
    { title: 'अधूरा सपना', excerpt: 'कुछ बातें अधूरी रह गईं...', author: 'Sara' },
  ],
  motivation: [
    { title: 'उठो और चलो', excerpt: 'हर गिरावट एक शुरुआत है...', author: 'Rahul' },
  ],
  nature: [
    { title: 'बारिश', excerpt: 'बूँदों में छुपा है संगीत...', author: 'Priya' },
  ],
  life: [
    { title: 'ज़िंदगी', excerpt: 'हर पल एक नई कहानी...', author: 'Vikram' },
  ],
  sufi: [
    { title: 'रूहानी राह', excerpt: 'इबादत में खुदा मिले...', author: 'Farid' },
  ],
  shayari: [
    { title: 'शाम-ए-शायरी', excerpt: 'अल्फ़ाज़ दिल से निकले...', author: 'Noor' },
  ],
  friendship: [
    { title: 'दोस्ती', excerpt: 'हाथ थामे रहना हर मुश्किल में...', author: 'Arjun' },
  ],
};

function CategoryContent() {
  const [selected, setSelected] = useState<string | null>(null);

  const featured = selected ? POEMS_BY_CATEGORY[selected] || [] : [];

  return (
    <>
      <div className="page-header">
        <h1>श्रेणियाँ</h1>
        <p>भावना, विषय और कला के अनुसार कविताएँ खोजें</p>
      </div>

      <section style={{ paddingTop: 0 }}>
        <div className="mehfil-container">
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => setSelected(cat.id)}
                style={selected === cat.id ? { borderColor: 'var(--accent)' } : {}}
              >
                <div className="category-icon-circle">{cat.icon}</div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'Cormorant Garamond', color: 'var(--accent-dark)', marginBottom: '0.5rem' }}>
                  {cat.label}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {(POEMS_BY_CATEGORY[cat.id] || []).length} रचनाएँ
                </p>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <div className="featured-badge" style={{ marginBottom: '8px' }}>
                    <i className="fas fa-feather-alt" /> चयनित श्रेणी
                  </div>
                  <h2 className="section-title" style={{ fontSize: '2.4rem', margin: 0, textAlign: 'left' }}>
                    {CATEGORIES.find((c) => c.id === selected)?.label} रचनाएँ
                  </h2>
                </div>
                <Link
                  href={`/poems?category=${selected}`}
                  className="primary-btn"
                  style={{ textDecoration: 'none', padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  <i className="fas fa-book-open" /> सभी कविताएँ देखें
                </Link>
              </div>
              {featured.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  ✨ इस श्रेणी में अभी कोई रचनाएँ नहीं हैं।
                </p>
              ) : (
                <div className="poems-list-grid">
                  {featured.map((poem, i) => (
                    <Link
                      href={`/poems?search=${encodeURIComponent(poem.title)}`}
                      className="poem-card"
                      key={i}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="poem-card-header">
                        <div className="card-top-icon">{CATEGORIES.find((c) => c.id === selected)?.icon || '❤️'}</div>
                        <span className="mood">{CATEGORIES.find((c) => c.id === selected)?.label}</span>
                      </div>
                      <h3>{poem.title}</h3>
                      <p>{poem.excerpt}</p>
                      <div className="poem-footer" style={{ marginTop: 'auto' }}>
                        <span>By {poem.author}</span>
                        <span className="poem-footer-read">
                          <span>पढ़ें</span>
                          <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="loader-wrapper"><div className="spinner" /></div>}>
      <CategoryContent />
    </Suspense>
  );
}
