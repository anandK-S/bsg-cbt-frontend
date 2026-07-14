'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout failed on backend', e);
    }
    logout();
    window.location.href = '/';
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isTakeExamPage = pathname?.includes('/take');

  if (isTakeExamPage) return null;

  const NavLinks = () => (
    <>
      {isAuthenticated && _hasHydrated ? (
        <>
          {user?.role === 'Admin' && (
            <Link href="/admin" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <LayoutDashboard size={18} /> Admin Dashboard
            </Link>
          )}
          {user?.role === 'Examiner' && (
            <Link href="/examiner" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <LayoutDashboard size={18} /> Examiner Dashboard
            </Link>
          )}
          {user?.role === 'Candidate' && (
            <Link href="/dashboard" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <LayoutDashboard size={18} /> My Exams
            </Link>
          )}
          
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 border-l border-border pl-4 ml-2">
            <UserIcon size={16} />
            <span className="truncate max-w-[120px]">{user?.name}</span>
          </div>
          
          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border border-red-500/20">
            <LogOut size={16} /> Logout
          </button>
        </>
      ) : (
        !isAuthPage && _hasHydrated && (
          <Link href="/login" className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg">
            Login
          </Link>
        )
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <span className="text-white font-extrabold text-xs">BSG</span>
              </div>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-bsg-blue to-bsg-gold tracking-tight">
                CBT Portal
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLinks />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col items-start shadow-inner">
              {isAuthenticated && _hasHydrated && (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2 border-b border-border w-full">
                  <UserIcon size={16} />
                  <span className="font-medium text-foreground">{user?.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{user?.role}</span>
                </div>
              )}
              <div className="flex flex-col space-y-3 w-full" onClick={() => setIsMobileMenuOpen(false)}>
                <NavLinks />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
