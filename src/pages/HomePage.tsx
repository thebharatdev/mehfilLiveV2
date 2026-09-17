'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from '@/lib/navigation';
import { useRouter } from '@/lib/navigation';
import { API_BASE_URL, Poem, Writer } from '@/lib/mehfil';
import { sharePoemImage } from '@/lib/shareImage';
import { useToast } from '@/components/site/ToastProvider';

const MOOD_ICONS: Record<string, string> = {
  Love: '❤️', Sad: '🌧', Motivation: '✨', Nature: '🍃', Life: '🌙', Sufi: '☪', Shayari: '🖋', Friendship: '🤝',
};

const CATEGORIES = [
  { icon: '❤️', hindi: 'शृंगार व मोहब्बत', english: 'Love', mood: 'Love' },
  { icon: '🌧️', hindi: 'करुण व विरह', english: 'Sadness', mood: 'Sad' },
  { icon: '✨', hindi: 'वीर व प्रेरणा', english: 'Motivation', mood: 'Motivation' },
  { icon: '🍃', hindi: 'शांत व प्रकृति', english: 'Nature', mood: 'Nature' },
  { icon: '🌙', hindi: 'दर्शन व ज़िंदगी', english: 'Life', mood: 'Life' },
  { icon: '🕊️', hindi: 'रूहानियत व सूफ़ी', english: 'Sufi', mood: 'Sufi' },
  { icon: '✒️', hindi: 'ग़ज़ल व शायरी', english: 'Shayari', mood: 'Shayari' },
  { icon: '🤝', hindi: 'मैत्री व दोस्ती', english: 'Friendship', mood: 'Friendship' },
];

interface SherItem {
  id: string;
  misra1: string;
  misra2: string;
  poet: string;
  genre: string;
}

const CELEBRATED_SHERS: SherItem[] = [
  {
    id: 'ghalib-1',
    misra1: 'हज़ारों ख़्वाहिशें ऐसी कि हर ख़्वाहिश पे दम निकले',
    misra2: 'बहुत निकले मिरे अरमाँ लेकिन फिर भी कम निकले',
    poet: 'मिर्ज़ा ग़ालिब',
    genre: 'ग़ज़ल',
  },
  {
    id: 'dushyant-1',
    misra1: 'तू किसी रेल-सी गुज़रती है',
    misra2: 'मैं किसी पुल-सा थरथराता हूँ',
    poet: 'दुष्यंत कुमार',
    genre: 'गीत / नज़्म',
  },
  {
    id: 'rahat-1',
    misra1: 'आँखों में पानी रखो होंठों पे चिंगारी रखो',
    misra2: 'ज़िंदा रहना है तो तरकीबें बहुत सारी रखो',
    poet: 'राहत इंदौरी',
    genre: 'शायरी',
  },
  {
    id: 'iqbal-1',
    misra1: 'सितारों से आगे जहाँ और भी हैं',
    misra2: 'अभी इश्क़ के इम्तिहाँ और भी हैं',
    poet: 'अल्लामा इक़बाल',
    genre: 'सूफ़ी व फलसफ़ा',
  },
  {
    id: 'bashir-1',
    misra1: 'उजाले अपनी यादों के हमारे साथ रहने दो',
    misra2: 'न जाने किस गली में ज़िंदगी की शाम हो जाए',
    poet: 'बशीर बद्र',
    genre: 'ग़ज़ल',
  },
  {
    id: 'jaun-1',
    misra1: 'जो गुज़ारी न जा सकी हमसे',
    misra2: 'हमने वो ज़िंदगी गुज़ारी है',
    poet: 'जॉन एलिया',
    genre: 'शायरी',
  },
  {
    id: 'gulzar-1',
    misra1: 'हाथ छूटें भी तो रिश्ते नहीं छूटा करते',
    misra2: 'वक़्त की शाख़ से लम्हे नहीं टूटा करते',
    poet: 'गुलज़ार',
    genre: 'नज़्म',
  },
  {
    id: 'parveen-1',
    misra1: 'वो तो ख़ुशबू है हवाओं में बिखर जाएगा',
    misra2: 'मसअला फूल का है फूल किधर जाएगा',
    poet: 'परवीन शाकिर',
    genre: 'ग़ज़ल',
  },
];

const WORDS_OF_THE_DAY = [
  {
    word: 'सहर',
    translit: 'Sahar',
    pos: 'संज्ञा, स्त्रीलिंग',
    meaning: 'भोर, प्रभात, सवेरा (Morning / Dawn)',
    verse: 'सहर होते ही बुझ जाते हैं उम्मीदों के सब दीपक, मगर दिल में तिरी यादों का इक ख़ुर्शीद रहता है...',
  },
  {
    word: 'क़ुर्बत',
    translit: 'Qurbat',
    pos: 'संज्ञा, स्त्रीलिंग',
    meaning: 'नज़दीकी, सामिप्य, निकटता (Closeness / Proximity)',
    verse: 'क़ुर्बतें लाख सही पर वो तअल्लुक़ न रहा, अब मुलाक़ात भी होती है तो बेगाना-वार...',
  },
  {
    word: 'इत्तिफ़ाक़',
    translit: 'Ittifaq',
    pos: 'संज्ञा, पुल्लिंग',
    meaning: 'संयोग, अचानक मिलना (Coincidence / Unplanned meeting)',
    verse: 'इत्तिफ़ाक़ अपनी जगह है मगर ऐ दोस्त कभी, ढूँढने से भी वो खोए हुए पल मिलते नहीं...',
  },
  {
    word: 'मुन्तज़िर',
    translit: 'Muntazir',
    pos: 'विशेषण',
    meaning: 'प्रतीक्षारत, इंतज़ार करने वाला (Awaiting / Longing)',
    verse: 'रास्ते बंद सही, आँख मगर मुन्तज़िर है, किसी रौशन से ख़याल की आमद के लिए...',
  },
];

const SEARCH_SUGGESTIONS = ['मिर्ज़ा ग़ालिब', 'राहत इंदौरी', 'मोहब्बत', 'ज़िंदगी', 'ग़ज़ल', 'वीर रस'];

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingPoems, setLoadingPoems] = useState(true);
  const [loadingWriters, setLoadingWriters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredLiked, setFeaturedLiked] = useState(false);
  const [featuredSaved, setFeaturedSaved] = useState(false);
  const [featuredLikesCount, setFeaturedLikesCount] = useState(148);
  const [sherIndex, setSherIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [sherCopied, setSherCopied] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSher = CELEBRATED_SHERS[sherIndex];
  const currentWord = WORDS_OF_THE_DAY[wordIndex];

  // Fade-up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' },
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [poems, writers, sherIndex]);

  // Load featured poems
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/poems/featured`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.poems) setPoems(data.poems);
        setLoadingPoems(false);
      })
      .catch(() => setLoadingPoems(false));
  }, []);

  // Load featured writers
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/featured-writers`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.writers) setWriters(data.writers);
        setLoadingWriters(false);
      })
      .catch(() => setLoadingWriters(false));
  }, []);

  // Auto-slider for featured poems
  useEffect(() => {
    if (loadingPoems || poems.length === 0) return;
    const startTimer = setTimeout(() => {
      const slider = sliderRef.current;
      if (!slider) return;

      const start = () => {
        autoScrollRef.current = setInterval(() => {
          slider.scrollBy({ left: 340, behavior: 'smooth' });
          const maxScroll = slider.scrollWidth - slider.clientWidth;
          if (slider.scrollLeft >= maxScroll - 20) {
            setTimeout(() => slider.scrollTo({ left: 0, behavior: 'smooth' }), 500);
          }
        }, 2200);
      };
      const stop = () => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      };

      start();
      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      slider.addEventListener('touchstart', stop);
      slider.addEventListener('touchend', start);

      return () => {
        stop();
        slider.removeEventListener('mouseenter', stop);
        slider.removeEventListener('mouseleave', start);
        slider.removeEventListener('touchstart', stop);
        slider.removeEventListener('touchend', start);
      };
    }, 2000);

    return () => clearTimeout(startTimer);
  }, [loadingPoems, poems.length]);

  const getCurrentUser = () => {
    const user = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
    if (user) {
      try { return JSON.parse(user); } catch { return null; }
    }
    return null;
  };

  const handlePublish = () => {
    const user = getCurrentUser();
    if (!user) {
      showToast('✍️ कृपया पहले प्रवेश करें या पंजीकरण करें।', true);
      setTimeout(() => router.push('/login'), 1200);
      return;
    }
    router.push('/publish');
  };

  const handleExplore = () => {
    router.push('/poems');
  };

  const handleCategoryClick = (mood: string, hindi: string) => {
    showToast(`✨ ${hindi} की रचनाएँ खोली जा रही हैं...`);
    router.push(`/category/${mood}`);
  };

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/poems?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCopySher = () => {
    const text = `“${currentSher.misra1}\n${currentSher.misra2}”\n\n— ${currentSher.poet} (${currentSher.genre})\nसाभार: मेहफ़िल (Mehfil)`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setSherCopied(true);
      showToast('📋 शेर प्रतिलिपि (Copy) हो गया!');
      setTimeout(() => setSherCopied(false), 2000);
    }
  };

  const handleShareSher = async () => {
    try {
      await sharePoemImage(
        {
          title: `शेर — ${currentSher.poet}`,
          body: `${currentSher.misra1}\n${currentSher.misra2}`,
          authorName: currentSher.poet,
          category: 'शेर-ओ-सुख़न',
          theme: 'royal',
          align: 'center',
        },
        window.location.origin,
      );
      showToast('✨ शेर का सुंदर कार्ड साझा करें!');
    } catch {
      handleCopySher();
    }
  };

  const handleNextSher = () => {
    setSherIndex((prev) => (prev + 1) % CELEBRATED_SHERS.length);
  };

  const handleNextWord = () => {
    setWordIndex((prev) => (prev + 1) % WORDS_OF_THE_DAY.length);
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="mehfil-container hero-grid">
          <div>
            <div className="hero-pretitle">
              <i className="fas fa-feather-alt" /> भारत का आधुनिक साहित्य मंच
            </div>
            <h1>
              जहाँ अल्फ़ाज़ <br />
              <span className="hero-highlight">एहसास बनते हैं</span>...
            </h1>
            <p>
              रेख़्ता और हिंदवी की गरिमा से प्रेरित, हिंदी और उर्दू साहित्य का भव्य आँगन।
              हज़ारों कालजयी नज़्में, ग़ज़लें, दोहे और नए साहित्यकारों की ताज़ा आवाज़ें।
            </p>
            <div className="hero-divider"><span></span>❦<span></span></div>
            <form onSubmit={handleSearch} className="hero-search">
              <i className="fas fa-search" style={{ marginRight: '10px', color: 'var(--accent)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="कविता, ग़ज़ल, शायर या लफ़्ज़ खोजें..."
              />
              <button type="submit" className="hero-search-btn">
                <span>खोजें</span>
                <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }} />
              </button>
            </form>

            {/* Quick Search Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '0.8rem 0 1.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>लोकप्रिय खोजें:</span>
              {SEARCH_SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => router.push(`/poems?search=${encodeURIComponent(term)}`)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(189, 142, 78, 0.22)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(189, 142, 78, 0.22)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="hero-buttons">
              <button className="primary-btn" onClick={handleExplore}>
                <i className="fas fa-book-open" /> कविताएँ पढ़ें
              </button>
              <button className="secondary-btn" onClick={handlePublish}>
                <i className="fas fa-pen-fancy" /> अपनी रचना लिखें
              </button>
            </div>
          </div>

          <div className="hero-cards">
            <div className="float-card">
              <div className="float-card-header">
                <span className="float-card-tag">✦ इश्क़ व मोहब्बत</span>
                <span style={{ fontSize: '1.1rem' }}>❤️</span>
              </div>
              <p className="float-card-verse">&ldquo;तुम्हें पढ़ना किसी पुरानी किताब की तरह है, हर दफ़ा नया एहसास मिलता है...&rdquo;</p>
              <div className="float-card-author">
                <i className="fas fa-pen-nib" style={{ fontSize: '0.7rem', color: 'var(--accent)' }} />
                <span>वसीम बरेलवी</span>
              </div>
            </div>
            <div className="float-card">
              <div className="float-card-header">
                <span className="float-card-tag">✦ ख़ामोशी व तन्हाई</span>
                <span style={{ fontSize: '1.1rem' }}>🌙</span>
              </div>
              <p className="float-card-verse">&ldquo;रात की ख़ामोशी में कुछ अधूरे ख़्वाब अब भी जागते हैं...&rdquo;</p>
              <div className="float-card-author">
                <i className="fas fa-pen-nib" style={{ fontSize: '0.7rem', color: 'var(--accent)' }} />
                <span>राहत इंदौरी</span>
              </div>
            </div>
            <div className="float-card">
              <div className="float-card-header">
                <span className="float-card-tag">✦ उम्मीद व परवाज़</span>
                <span style={{ fontSize: '1.1rem' }}>✨</span>
              </div>
              <p className="float-card-verse">&ldquo;सितारों से आगे जहाँ और भी हैं, अभी इश्क़ के इम्तिहाँ और भी हैं...&rdquo;</p>
              <div className="float-card-author">
                <i className="fas fa-pen-nib" style={{ fontSize: '0.7rem', color: 'var(--accent)' }} />
                <span>अल्लामा इक़बाल</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rekhta / Hindwi Genre Ribbon */}
      <section style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
        <div className="mehfil-container">
          <div className="rekhta-genre-ribbon">
            <button
              type="button"
              className="genre-ribbon-pill active"
              onClick={() => router.push('/poems')}
            >
              <span>🏛️ सभी विधाएँ</span>
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.mood}
                type="button"
                className="genre-ribbon-pill"
                onClick={() => handleCategoryClick(cat.mood, cat.hindi)}
              >
                <span>{cat.icon}</span>
                <span>{cat.hindi}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* आज का शेर (Sher of the Day - Rekhta / Hindwi Flagship) */}
      <section style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="mehfil-container">
          <div className="sher-of-the-day-card fade-up">
            <span className="sher-corner-ornament sher-corner-tl">❦</span>
            <span className="sher-corner-ornament sher-corner-tr">❦</span>
            <span className="sher-corner-ornament sher-corner-bl">❦</span>
            <span className="sher-corner-ornament sher-corner-br">❦</span>

            <div className="sher-header-badge">
              <i className="fas fa-feather-alt" />
              <span>आज का शेर · ख़ास इंतख़ाब</span>
              <i className="fas fa-feather-alt" />
            </div>

            <div className="sher-verses">
              <span className="sher-misra">&ldquo;{currentSher.misra1}</span>
              <span className="sher-misra">{currentSher.misra2}&rdquo;</span>
            </div>

            <div className="sher-meta-row">
              <span className="sher-poet-tag">
                <i className="fas fa-pen-nib" style={{ color: 'var(--accent)', fontSize: '0.85rem' }} />
                {currentSher.poet}
              </span>
              <span className="sher-genre-tag">{currentSher.genre}</span>
            </div>

            <div className="sher-actions">
              <button
                type="button"
                className="sher-btn sher-btn-primary"
                onClick={handleCopySher}
                title="शेर प्रतिलिपि करें"
              >
                <i className={sherCopied ? 'fas fa-check' : 'fas fa-copy'} />
                <span>{sherCopied ? 'कॉपी हो गया' : 'शेर कॉपी करें'}</span>
              </button>

              <button
                type="button"
                className="sher-btn"
                onClick={handleShareSher}
                title="शेर साझा करें"
              >
                <i className="fas fa-share-alt" />
                <span>साझा करें</span>
              </button>

              <button
                type="button"
                className="sher-btn"
                onClick={handleNextSher}
                title="दूसरा शेर देखें"
              >
                <i className="fas fa-random" />
                <span>अगला शेर ({sherIndex + 1}/{CELEBRATED_SHERS.length})</span>
              </button>

              <button
                type="button"
                className="sher-btn"
                onClick={() => router.push(`/poems?search=${encodeURIComponent(currentSher.poet)}`)}
                title="इनकी रचनाएँ पढ़ें"
              >
                <i className="fas fa-book-open" />
                <span>रचनाएँ पढ़ें</span>
              </button>
            </div>
          </div>

          {/* आज का लफ़्ज़ (Word of the Day / लफ़्ज़-ओ-मानी) */}
          <div className="word-of-the-day-card fade-up">
            <div className="word-box">
              <div className="word-badge">
                <i className="fas fa-book-reader" /> आज का लफ़्ज़ (Word of the Day)
              </div>
              <div className="word-main">{currentWord.word}</div>
              <div className="word-translit">{currentWord.translit}</div>
              <div className="word-pos">{currentWord.pos}</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="word-meaning-title">अर्थ / मानी:</div>
                <button
                  type="button"
                  onClick={handleNextWord}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fas fa-sync-alt" /> दूसरा लफ़्ज़
                </button>
              </div>
              <div className="word-meaning-text">{currentWord.meaning}</div>
              <div className="word-verse-example">
                &ldquo;{currentWord.verse}&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* विशेष रचनाएँ */}
      <section>
        <div className="mehfil-container">
          <div className="featured-header">
            <div>
              <div className="featured-badge">
                <i className="fas fa-feather-alt" /> आज की चयनित रचनाएँ
              </div>
              <h2 className="featured-title">विशेष रचनाएँ</h2>
              <div className="featured-divider"><span></span>❦<span></span></div>
              <p className="featured-desc">
                हिंदी साहित्य प्रेमियों द्वारा सबसे अधिक पढ़ी गई और सराही गई रचनाएँ।
              </p>
            </div>
            <div className="featured-poem">
              शब्दों से ही तो है पहचान हमारी,<br />
              जो दिल से निकले वही रचना हमारी...
            </div>
          </div>

          <div className="poem-grid" ref={sliderRef}>
            {loadingPoems ? (
              <div className="loader-wrapper">
                <div className="loader-dots"><span></span><span></span><span></span></div>
                <div className="loader-text">अल्फ़ाज़ आ रहे हैं...</div>
              </div>
            ) : poems.length === 0 ? (
              <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)', padding: '2rem' }}>
                ✨ कोई रचनाएँ नहीं मिलीं।
              </p>
            ) : (
              poems.map((poem) => (
                <Link href={`/poem/${poem.slug}`} key={poem._id} className="poem-card fade-up" style={{ cursor: 'pointer' }}>
                  <div className="poem-card-header">
                    <div className="card-top-icon">{MOOD_ICONS[poem.category || ''] || '❤️'}</div>
                    <span className="mood">{poem.category || 'अन्य'}</span>
                  </div>
                  <h3>{poem.title}</h3>
                  <p>{(poem.body || '').substring(0, 120)}...</p>
                  <div className="poem-footer">
                    <span>By {poem.author?.firstName || 'अज्ञात'}</span>
                    <span className="poem-footer-read">
                      <span>पढ़ें</span>
                      <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Writer of the Week */}
      <section>
        <div className="mehfil-container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div className="featured-badge" style={{ margin: 'auto auto 20px' }}>
              <i className="fas fa-crown" /> इस सप्ताह के साहित्यकार
            </div>
            <h2 className="section-title">सप्ताह के रचनाकार</h2>
            <p className="section-subtitle" style={{ maxWidth: '700px', margin: '20px auto 0', border: 'none', padding: 0 }}>
              हर हफ़्ते एक चुनी हुई कलम जिसके अल्फ़ाज़ ने दिलों पर गहरी छाप छोड़ी।
            </p>
          </div>

          {loadingWriters ? (
            <div className="loader-wrapper">
              <div className="loader-dots"><span></span><span></span><span></span></div>
              <div className="loader-text">सप्ताह के रचनाकार आ रहे हैं...</div>
            </div>
          ) : writers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              ✨ अभी तक कोई सप्ताह के रचनाकार नहीं चुने गए।
            </p>
          ) : (
            <Link
              href={`/author?id=${writers[0]._id}`}
              className="wotw-card fade-up"
              style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
            >
              <div className="wotw-image-side">
                {writers[0].profilePic ? (
                  <img src={writers[0].profilePic} alt={`${writers[0].firstName} ${writers[0].lastName || ''}`} />
                ) : (
                  <div className="wotw-image-placeholder">
                    <i className="fas fa-feather-alt" />
                  </div>
                )}
                <div className="wotw-crown-badge">
                  <i className="fas fa-crown" />
                </div>
              </div>
              <div className="wotw-content-side">
                <div className="wotw-award-label">
                  <i className="fas fa-award" /> सप्ताह का सम्मान
                </div>
                <h3 className="wotw-name">
                  {writers[0].firstName} {writers[0].lastName || ''}
                </h3>
                <div className="wotw-divider"><span></span>❦<span></span></div>
                <p className="wotw-bio">
                  {writers[0].bio || 'शब्दों का मुसाफ़िर, एहसासों का हमसफ़र। इनकी कलम में वो जादू है जो हर दिल को छू जाता है।'}
                </p>
                <div className="wotw-stats">
                  <div className="wotw-stat">
                    <i className="fas fa-book-open" />
                    <span>{writers[0].poemsCount || 0} रचनाएँ</span>
                  </div>
                  {writers[0].city && (
                    <div className="wotw-stat">
                      <i className="fas fa-map-marker-alt" />
                      <span>{writers[0].city}</span>
                    </div>
                  )}
                </div>
                <div className="wotw-cta">
                  <i className="fas fa-user-circle" /> इनकी प्रोफ़ाइल पढ़ें
                  <i className="fas fa-arrow-right" style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Writers */}
      <section>
        <div className="mehfil-container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div className="featured-badge" style={{ margin: 'auto auto 20px' }}>
              <i className="fas fa-crown" /> साहित्य के चमकते सितारे
            </div>
            <h2 className="section-title">लोकप्रिय रचनाकार</h2>
            <p className="section-subtitle" style={{ maxWidth: '700px', margin: '20px auto 0', border: 'none', padding: 0 }}>
              हज़ारों पाठकों द्वारा पसंद किए गए रचनाकार जिनके अल्फ़ाज़ दिलों को छू जाते हैं।
            </p>
          </div>

          <div className="writers-row">
            {loadingWriters ? (
              <div className="loader-wrapper">
                <div className="loader-dots"><span></span><span></span><span></span></div>
                <div className="loader-text">रचनाकार आ रहे हैं...</div>
              </div>
            ) : writers.length === 0 ? (
              <p style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)', padding: '2rem' }}>
                ✨ कोई रचनाकार नहीं मिले।
              </p>
            ) : (
              writers.map((writer) => (
                <Link href={`/author?id=${writer._id}`} key={writer._id} className="writer-card fade-up" style={{ cursor: 'pointer' }}>
                  <div className="writer-img">
                    {writer.profilePic ? (
                      <img src={writer.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt={writer.firstName} />
                    ) : (
                      <i className="fas fa-feather-alt" />
                    )}
                  </div>
                  <h3 className="poet-card-name" style={{ fontFamily: "'Noto Serif Devanagari', 'Playfair Display', 'Cormorant Garamond', serif", fontWeight: 700, fontSize: '1.35rem', color: 'var(--accent-dark)', letterSpacing: '0.2px', margin: '0.4rem 0' }}>
                    {writer.firstName} {writer.lastName || ''}
                  </h3>
                  <p>मेहफ़िल के लोकप्रिय रचनाकार</p>
                  <button className="follow-btn">View Profile</button>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="mehfil-container">
          <div style={{ marginBottom: '30px' }}>
            <h2 className="section-title">नवरस व भावनाएँ</h2>
            <p className="section-subtitle">Read poetry categorized by mood, deep feeling, and literary rasas.</p>
          </div>
          <div className="categories">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.mood}
                className="category"
                onClick={() => handleCategoryClick(cat.mood, cat.hindi)}
              >
                <div className="category-icon-box">{cat.icon}</div>
                <div className="category-info">
                  <span className="category-title">{cat.hindi}</span>
                  <span className="category-subtitle">{cat.english} Poetry</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive Poem Reading */}
      <section>
        <div className="mehfil-container">
          <div className="reading-layout fade-up">
            <div className="featured-reading-card">
              <div className="poem-side">
                <div className="poem-badge">
                  <i className="fas fa-feather-alt" /> चयनित रचना
                </div>
                <h2 className="poem-title">एक अधूरी शाम</h2>
                <div className="poem-line"></div>
                <div className="poet">
                  <span><i className="far fa-user" /> रचनाकार: अयान</span>
                  <span>•</span>
                  <span><i className="far fa-calendar-alt" /> 12 मई 2026</span>
                </div>
                <div className="poem-text">
                  तुम्हारी आवाज़ अब भी<br />
                  मेरे कमरे की दीवारों में रहती है...<br /><br />
                  कुछ बातें थीं जो कभी पूरी नहीं हुईं,<br />
                  कुछ शामें थीं जो आज भी अधूरी हैं...<br /><br />
                  और हाँ, हर रात उन्हीं अल्फ़ाज़ों में तुम्हें ढूँढ लेता हूँ...
                </div>
                <div className="poem-actions">
                  <button
                    type="button"
                    className={`action ${featuredLiked ? 'active' : ''}`}
                    onClick={() => {
                      const next = !featuredLiked;
                      setFeaturedLiked(next);
                      setFeaturedLikesCount((c) => (next ? c + 1 : c - 1));
                      showToast(next ? '❤️ रचना को पसंद किया गया!' : 'पसंद हटा दी गई');
                    }}
                  >
                    <i className={featuredLiked ? 'fas fa-heart' : 'far fa-heart'} />
                    <span>{featuredLiked ? 'पसंद किया' : 'पसंद करें'} ({featuredLikesCount})</span>
                  </button>
                  <button
                    type="button"
                    className={`action ${featuredSaved ? 'active' : ''}`}
                    onClick={() => {
                      const next = !featuredSaved;
                      setFeaturedSaved(next);
                      showToast(next ? '🔖 रचना को सहेज लिया गया!' : 'संग्रह से हटाया गया');
                    }}
                  >
                    <i className={featuredSaved ? 'fas fa-bookmark' : 'far fa-bookmark'} />
                    <span>{featuredSaved ? 'सहेजा गया' : 'सहेजें'}</span>
                  </button>
                  <button
                    type="button"
                    className="action"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.origin + '/poems');
                      }
                      showToast('🔗 रचना का लिंक कॉपी किया गया!');
                    }}
                  >
                    <i className="fas fa-share-alt" />
                    <span>साझा करें</span>
                  </button>
                </div>
              </div>
              <div className="visual-side">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop"
                  alt="Poetry Evening"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mehfil-container">
          <div className="cta fade-up">
            <h2 style={{ fontSize: '3rem', fontFamily: 'Cormorant Garamond', fontWeight: 700, color: 'var(--text-dark)' }}>
              अपनी रचनाओं को <br />
              दुनिया तक पहुँचाइए
            </h2>
            <p style={{ margin: '1.2rem 0', color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              Join thousands of poets and literature lovers sharing authentic emotions,
              soulful ghazals, and timeless verses through modern Hindi &amp; Urdu poetry.
            </p>
            <button className="primary-btn" onClick={handlePublish}>
              <i className="fas fa-feather-alt" /> रचना प्रकाशित करें
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
