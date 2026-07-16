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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show welcome modal once per session
    if (!sessionStorage.getItem('welcomeShown')) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('welcomeShown', 'true');
    }
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
          <div className="w-10 h-10 bg-gradient-to-br from-bsg-blue to-blue-800 rounded-xl flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={22} strokeWidth={2.5} />
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
        
        {/* Developed By Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, type: 'spring' }}
          className="mt-32 max-w-5xl mx-auto w-full px-4 text-left"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
            
            <div className="relative z-10 md:w-1/3 flex justify-center">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-bsg-blue/20 shadow-2xl relative group bg-white flex items-center justify-center">
                <img 
                  src="/anandkumar-scout.jpg" 
                  alt="Anandkumar Sharma Scout" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-bsg-blue/5 group-hover:bg-transparent transition-colors duration-300"></div>
              </div>
            </div>
            
            <div className="relative z-10 md:w-2/3 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-bsg-blue text-xs font-bold uppercase tracking-widest">
                Developer & Architect
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Anandkumar Sharma</h2>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Anandkumar Sharma is a Rover of 33rd NAIR, B.P Group, Vadodara Division, Western Railway. The BSG CBT Portal was engineered to provide a secure, seamless examination experience.
              </p>
              
              <div className="pt-4 flex items-center justify-center md:justify-start">
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 text-center text-sm font-medium text-gray-500 space-x-6"
        >
          <a href="/terms" className="hover:text-bsg-blue transition-colors">Terms & Conditions</a>
          <a href="/privacy" className="hover:text-bsg-blue transition-colors">Privacy Policy</a>
        </motion.div>
      </main>
      
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bsg-blue to-bsg-gold"></div>
            <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-bsg-blue/20 shadow-md">
              <img 
                src="/anandkumar-scout.jpg" 
                alt="Developer" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-blue-100 text-bsg-blue text-xs font-bold uppercase tracking-widest">
              Developer & Architect
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Anandkumar Sharma</h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-8 text-sm">
              Rover of 33rd NAIR, B.P Group, Vadodara Division, Western Railway.<br/>
              Engineered the BSG CBT Portal for a secure examination experience.
            </p>
            <button 
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-bsg-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Continue to Portal
            </button>
          </motion.div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
