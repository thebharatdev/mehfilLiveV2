'use client';

import { useState, useEffect, useRef } from 'react';
import Link from '@/lib/navigation';
import { usePathname, useRouter } from '@/lib/navigation';

interface UserData {
  firstName?: string;
  lastName?: string;
  profilePic?: string;
  email?: string;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readUser = () => {
      const stored =
        localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
      if (!stored) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(stored) as UserData);
      } catch {
        setUser(null);
      }
    };

    readUser();
    window.addEventListener('storage', readUser);
    window.addEventListener('mehfil-auth-change', readUser);
    return () => {
      window.removeEventListener('storage', readUser);
      window.removeEventListener('mehfil-auth-change', readUser);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePublish = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/publish');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mehfil_user');
    localStorage.removeItem('mehfil_remember');
    localStorage.removeItem('token');
    sessionStorage.removeItem('mehfil_user');
    setUser(null);
    window.dispatchEvent(new Event('mehfil-auth-change'));
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'मुखपृष्ठ', icon: 'fas fa-home' },
    { href: '/poems', label: 'कविताएँ', icon: 'fas fa-book-open' },
    { href: '/poets', label: 'रचनाकार', icon: 'fas fa-feather-alt' },
    { href: '/category', label: 'श्रेणियाँ', icon: 'fas fa-th-large' },
  ];

  return (
    <>
      <div
        className={`mobile-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <nav className="header-nav">
        <div className="mehfil-container nav-inner">
          <Link href="/" className="logo">
            <i className="fas fa-feather-alt" /> मेहफ़िल
          </Link>
          <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-logo">
                <i className="fas fa-feather-alt" /> मेहफ़िल
              </div>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMenuOpen(false)}
                aria-label="बंद करें"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {user ? (
              <div className="mobile-user-card">
                {user.profilePic ? (
                  <img
                    className="avatar-img"
                    src={user.profilePic}
                    alt={user.firstName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%' }}
                  />
                ) : (
                  <span className="avatar-initial" style={{ width: '42px', height: '42px' }}>
                    {(user.firstName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{user.firstName} {user.lastName || ''}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email || 'साहित्य प्रेमी'}</div>
                </div>
              </div>
            ) : (
              <div className="mobile-guest-card">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  अल्फ़ाज़ों की दुनिया में आपका स्वागत है
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/login" className="mobile-auth-btn" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-sign-in-alt" /> प्रवेश करें
                  </Link>
                  <Link href="/signup" className="mobile-auth-btn mobile-auth-btn-alt" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-user-plus" /> पंजीकरण
                  </Link>
                </div>
              </div>
            )}

            <div className="mobile-nav-section-title">मुख्य मंच</div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? 'active-nav-link' : ''}
                onClick={() => setMenuOpen(false)}
              >
                <i className={`${link.icon} mobile-link-icon`} />
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="mobile-nav-section-title">साहित्यिक रस</div>
            <div className="mobile-mood-grid">
              <Link href="/category/Shayari" onClick={() => setMenuOpen(false)}>ग़ज़ल व शायरी</Link>
              <Link href="/category/Love" onClick={() => setMenuOpen(false)}>शृंगार (Love)</Link>
              <Link href="/category/Sad" onClick={() => setMenuOpen(false)}>विरह (Sad)</Link>
              <Link href="/category/Sufi" onClick={() => setMenuOpen(false)}>सूफ़ी कलाम</Link>
            </div>

            {user ? (
              <div className="mobile-drawer-footer">
                <Link href="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                  <i className="fas fa-user-circle" /> मेरी प्रोफ़ाइल
                </Link>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-sign-out-alt" /> लॉग आउट
                </button>
              </div>
            ) : null}
          </div>

          <div className="nav-actions">
            <Link
              href="/poems"
              className="nav-icon-btn"
              title="कविता व रचनाकार खोजें"
              aria-label="खोजें"
            >
              <i className="fas fa-search" />
            </Link>

            <button className="nav-btn write-btn" onClick={handlePublish}>
              <i className="fas fa-pen-fancy" />
              <span>लिखें</span>
            </button>

            {user && (
              <div
                ref={avatarRef}
                className={`profile-avatar ${avatarOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setAvatarOpen(!avatarOpen);
                }}
              >
                {user.profilePic ? (
                  <img
                    className="avatar-img"
                    src={user.profilePic}
                    alt={`${user.firstName || 'User'} profile`}
                  />
                ) : (
                  <span className="avatar-initial">
                    {(user.firstName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="profile-dropdown">
                  <div className="user-greeting">
                    ✨ नमस्ते, {user.firstName}
                  </div>
                  <Link href="/profile" className="dropdown-item">
                    <i className="fas fa-user-circle" /> मेरी प्रोफ़ाइल
                  </Link>
                  <Link href="/profile#my-poems" className="dropdown-item">
                    <i className="fas fa-book-open" /> मेरी रचनाएँ
                  </Link>
                  <div className="dropdown-divider" />
                  <a
                    href="#"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <i className="fas fa-sign-out-alt" /> लॉग आउट
                  </a>
                </div>
              </div>
            )}
            <div
              className="menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="मेनू खोलें"
            >
              <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
