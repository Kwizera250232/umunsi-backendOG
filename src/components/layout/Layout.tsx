import { useEffect, type ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { attachPostPrefetchListeners } from '../../lib/prefetchPost';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useEffect(() => attachPostPrefetchListeners(), []);

  return (
    <div className="min-h-screen bg-[#0b0e11] flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
