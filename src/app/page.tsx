'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Brain, ChevronRight } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      if (user.role === 'Admin') router.push('/admin');
      else if (user.role === 'Examiner') router.push('/examiner');
      else router.push('/dashboard');
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  // Prevent flash of landing page while checking auth
  if (!mounted || (_hasHydrated && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bsg-blue"></div>
      </div>
    );
  }

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-bsg-blue selection:text-white overflow-hidden relative">
      {/* Light Theme Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-bsg-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-bsg-gold/20 blur-[120px] pointer-events-none" />
      
      {/* Navbar (Standalone for Landing Page) */}
      <header className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-bsg-blue rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-sm tracking-tighter">BSG</span>
          </div>
          <span className="text-bsg-blue font-extrabold text-xl tracking-tight hidden sm:block">
            CBT Portal
          </span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-4"
        >
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-bsg-blue font-semibold px-4 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="bg-bsg-blue hover:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Register
          </Link>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-12 text-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-bsg-blue text-sm font-bold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bsg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-bsg-gold"></span>
            </span>
            Next-Generation Assessment Platform
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
            Elevate Your <br className="hidden md:block" />
            <span className="text-bsg-blue">Testing Experience</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            The official, highly secure, and intelligent Computer Based Test (CBT) portal for Bharat Scouts and Guides proficiency badges and certifications.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/login" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-bsg-blue rounded-lg overflow-hidden transition-all hover:bg-blue-800 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Examination <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </Link>
            
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:text-bsg-blue transition-all"
            >
              Candidate Registration
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: 'spring' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto w-full px-4"
        >
          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-2xl hover:shadow-md transition-shadow group text-left">
            <div className="w-14 h-14 bg-blue-50 text-bsg-blue rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              Military-grade anti-cheat technology with fullscreen enforcement, focus tracking, and strict clipboard monitoring.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-2xl hover:shadow-md transition-shadow group text-left">
            <div className="w-14 h-14 bg-yellow-50 text-bsg-gold rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Offline Resilience</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              Auto-saving mechanism powered by IndexedDB ensures no data loss even during severe network interruptions.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-2xl hover:shadow-md transition-shadow group text-left">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Brain size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Insights</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              Post-exam qualitative analysis and personalized feedback generated by advanced Google Gemini models.
            </p>
          </div>
        </motion.div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
