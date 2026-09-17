import React, { useEffect, useState } from 'react';

export type LinkProps = React.ComponentPropsWithoutRef<'a'> & {
  href: string;
};

export function Link({ href, children, className, style, onClick, ...rest }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (
      !e.defaultPrevented &&
      href &&
      !href.startsWith('http') &&
      !href.startsWith('//') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('#')
    ) {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <a href={href} className={className} style={style} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export default Link;

const staticRouter = {
  push: (url: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  replace: (url: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  },
  back: () => {
    if (typeof window !== 'undefined') window.history.back();
  },
  forward: () => {
    if (typeof window !== 'undefined') window.history.forward();
  },
  refresh: () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new PopStateEvent('popstate'));
  },
};

export function useRouter() {
  return staticRouter;
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const onLocationChange = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  return pathname;
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    const onLocationChange = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  return searchParams;
}

function extractParams(pathname: string): Record<string, string> {
  if (pathname.startsWith('/poem/')) {
    const slug = pathname.replace(/^\/poem\//, '').split('/')[0].split('?')[0];
    return { slug: decodeURIComponent(slug) };
  }
  return {};
}

export function useParams(): Record<string, string> {
  const [params, setParams] = useState<Record<string, string>>(() =>
    extractParams(typeof window !== 'undefined' ? window.location.pathname : '')
  );

  useEffect(() => {
    const onLocationChange = () => {
      setParams(extractParams(window.location.pathname));
    };
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  return params;
}
