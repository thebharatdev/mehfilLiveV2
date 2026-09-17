'use client';

import { useEffect, useState } from 'react';
import Link from '@/lib/navigation';
import { usePathname } from '@/lib/navigation';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('mehfil_user') || sessionStorage.getItem('mehfil_user');
      setHasUser(!!stored);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('mehfil-auth-change', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('mehfil-auth-change', checkUser);
    };
  }, []);

  const navItems = [
    {
      href: '/',
      label: 'मुखपृष्ठ',
      icon: 'fas fa-home',
      isActive: pathname === '/' || pathname === '',
    },
    {
      href: '/poems',
      label: 'कविताएँ',
      icon: 'fas fa-book-open',
      isActive: pathname.startsWith('/poems') || pathname.startsWith('/poem/'),
    },
    {
      href: '/publish',
      label: 'लिखें',
      icon: 'fas fa-pen-fancy',
      isActive: pathname === '/publish',
      isSpecial: true,
    },
    {
      href: '/poets',
      label: 'शायर',
      icon: 'fas fa-feather-alt',
      isActive: pathname === '/poets' || pathname.startsWith('/author'),
    },
    {
      href: hasUser ? '/profile' : '/login',
      label: hasUser ? 'प्रोफ़ाइल' : 'प्रवेश',
      icon: hasUser ? 'fas fa-user-circle' : 'fas fa-sign-in-alt',
      isActive: pathname === '/profile' || pathname === '/login' || pathname === '/signup',
    },
  ];

  return (
    <div className="mobile-bottom-nav" role="navigation" aria-label="मोबाइल नेविगेशन">
      <div className="mobile-bottom-inner">
        {navItems.map((item) => {
          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-bottom-item mobile-bottom-special ${item.isActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                <div className="mobile-special-circle">
                  <i className={item.icon} />
                </div>
                <span className="mobile-bottom-label">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-item ${item.isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="mobile-item-icon-wrap">
                <i className={item.icon} />
                {item.isActive && <span className="mobile-active-dot" />}
              </div>
              <span className="mobile-bottom-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
