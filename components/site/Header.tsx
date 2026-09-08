'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
    { href: '/', label: 'मुखपृष्ठ' },
    { href: '/poems', label: 'कविताएँ' },
    { href: '/poets', label: 'रचनाकार' },
    { href: '/category', label: 'श्रेणियाँ' },
  ];

  return (
    <>
      <div
        className={`mobile-overlay ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <nav>
        <div className="mehfil-container nav-inner">
          <Link href="/" className="logo">
            <i className="fas fa-feather-alt" /> मेहफ़िल
          </Link>
          <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={pathname === link.href ? { color: 'var(--accent)' } : {}}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link href="/login">प्रवेश करें</Link>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="nav-btn write-btn" onClick={handlePublish}>
              <i className="fas fa-pen-fancy" />
              <span>लेखन प्रारम्भ करें</span>
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
            >
              <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
