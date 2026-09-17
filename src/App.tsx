import { usePathname } from '@/lib/navigation';
import { ToastProvider } from '@/components/site/ToastProvider';
import { Orbs } from '@/components/site/Orbs';
import { ScrollIndicator } from '@/components/site/ScrollIndicator';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileBottomNav } from '@/components/site/MobileBottomNav';

import HomePage from '@/pages/HomePage';
import PoemsPage from '@/pages/PoemsPage';
import PoetsPage from '@/pages/PoetsPage';
import CategoryPage from '@/pages/CategoryPage';
import PoemSlugPage from '@/pages/PoemSlugPage';
import AuthorPage from '@/pages/AuthorPage';
import PublishPage from '@/pages/PublishPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ProfilePage from '@/pages/ProfilePage';

export default function App() {
  const pathname = usePathname();

  const renderCurrentPage = () => {
    if (pathname === '/' || pathname === '') {
      return <HomePage />;
    }
    if (pathname === '/poems') {
      return <PoemsPage />;
    }
    if (pathname === '/poets') {
      return <PoetsPage />;
    }
    if (pathname === '/category') {
      return <CategoryPage />;
    }
    if (pathname.startsWith('/poem/')) {
      return <PoemSlugPage />;
    }
    if (pathname === '/author') {
      return <AuthorPage />;
    }
    if (pathname === '/publish') {
      return <PublishPage />;
    }
    if (pathname === '/login') {
      return <LoginPage />;
    }
    if (pathname === '/signup') {
      return <SignupPage />;
    }
    if (pathname === '/profile') {
      return <ProfilePage />;
    }
    return <HomePage />;
  };

  return (
    <ToastProvider>
      <Orbs />
      <ScrollIndicator />
      <div className="app-content-layer">
        <Header />
        <main className="min-h-screen flex-1">
          {renderCurrentPage()}
        </main>
        <Footer />
      </div>
      <MobileBottomNav />
    </ToastProvider>
  );
}
