'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function UnifiedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const isTakeExamPage = pathname?.includes('/take');
  const isPrintPage = pathname?.includes('/print');
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingScreen text="Initializing..." />
      </div>
    );
  }

  if (isTakeExamPage || isLandingPage || isPrintPage || isAuthPage) {
    return <main className="flex-grow flex flex-col relative z-10 w-full min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isAuthenticated && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
