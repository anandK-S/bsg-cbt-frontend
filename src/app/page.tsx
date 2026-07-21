'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Brain, ChevronRight, X, BookOpen, MapPin } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

  if (!mounted || (_hasHydrated && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-24 h-24 bg-bsg-blue/20 rounded-full animate-ping"></div>
          <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-bsg-blue to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 animate-bounce">
            <span className="text-white font-extrabold text-2xl">BSG</span>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-bsg-blue selection:text-white overflow-hidden relative">
      
      {/* Subtle Glassy Ambient Lights - Keeps the theme pure white but adds depth */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Navbar */}
      <header className="absolute top-0 w-full z-40 px-4 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 backdrop-blur-xl border border-gray-100 rounded-2xl px-6 py-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-bsg-blue to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md transform -rotate-3">
              <span className="font-extrabold text-sm">BSG</span>
            </div>
            <span className="text-gray-900 font-extrabold text-xl tracking-tight hidden sm:block">
              BSG Portal
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="text-gray-600 hover:text-bsg-blue font-bold px-3 py-2 text-sm sm:text-base transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-xl transition-all shadow-[0_4px_14px_0_rgba(10,54,157,0.39)] hover:shadow-[0_6px_20px_rgba(10,54,157,0.23)] hover:-translate-y-0.5">
              Register
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 pb-16 px-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto flex flex-col items-center text-center mt-4 sm:mt-8">
          
          {/* Top Badge (Exactly matching the reference image) */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-100 text-[#001b3a] text-xs sm:text-sm font-bold mb-8 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#002f6c]"></div>
            Bharat Scout & Guide
          </motion.div>

          {/* Main Title (Exactly matching the reference image) */}
          <motion.h1 variants={itemVariants} className="text-6xl sm:text-7xl md:text-[5.5rem] font-black text-[#111827] tracking-tight leading-[1.05] mb-2">
            Welcome to the <br className="hidden md:block" />
            <span className="text-[#2563eb]">BSG Portal</span>
          </motion.h1>

          {/* Sleek Vadodara Division Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 150 }}
            className="mb-8 mt-4"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-50/80 backdrop-blur-md border border-blue-100 text-bsg-blue rounded-xl font-bold shadow-sm">
              <MapPin size={18} className="animate-bounce" />
              Vadodara Division
            </div>
          </motion.div>

          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The official, highly secure examination portal engineered specifically for Bharat Scout & Guide testing.
          </motion.p>

          {/* Buttons (Exactly matching the reference image) */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Link href="/login" className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-[#111827] rounded-2xl overflow-hidden transition-all hover:bg-black shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5">
              <span className="relative z-10 flex items-center gap-2 text-lg">
                Start Examination <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 font-bold text-[#374151] bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all text-lg hover:-translate-y-0.5">
              Candidate Registration
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid (Upgraded with Glassy Effects but keeping white theme) */}
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-24 sm:mt-32 max-w-6xl mx-auto w-full px-4 sm:px-6">
          {[
            { icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Secure Examination', desc: 'Strict monitoring during BSG exam to maintain highest integrity.' },
            { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Reliable & Offline-Safe', desc: 'Data is auto-saved locally ensuring uninterrupted tests.' },
            { icon: Brain, color: 'text-bsg-blue', bg: 'bg-blue-50', title: 'Instant Insights', desc: 'Get immediate scoring and detailed feedback on your performance.' }
          ].map((feat, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-3xl hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-2">
              <div className={`w-16 h-16 ${feat.bg} ${feat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <feat.icon size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium">
                {feat.desc}
              </p>
            </div>
          ))}
        </motion.div>
        
        {/* Developed By Section */}
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="mt-32 max-w-5xl mx-auto w-full px-4 sm:px-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10 sm:gap-14 relative overflow-hidden text-white border border-gray-700/50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-bsg-blue/40 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 w-full md:w-1/3 flex justify-center">
              <motion.div animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="w-48 h-48 sm:w-56 sm:h-56 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl relative">
                <img src="/anandkumar-scout.jpg" alt="Anandkumar Sharma Scout" className="w-full h-full object-cover" />
              </motion.div>
            </div>
            
            <div className="relative z-10 w-full md:w-2/3 text-center md:text-left space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs sm:text-sm font-bold uppercase tracking-widest backdrop-blur-sm border border-white/5">
                Developer & Architect
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Anandkumar Sharma</h2>
              <p className="text-base sm:text-lg text-gray-300 font-medium leading-relaxed">
                Rover of 33rd NAIR, B.P Group, Vadodara Division, Western Railway.<br className="hidden sm:block"/>
                Engineered the BSG Portal to provide a seamless examination experience.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-24 text-center text-sm font-medium text-gray-400 flex items-center justify-center gap-6 pb-8">
          <button onClick={() => setShowTerms(true)} className="hover:text-gray-900 transition-colors flex items-center gap-2"><BookOpen size={16}/> Terms & Conditions</button>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors flex items-center gap-2"><ShieldCheck size={16}/> Privacy Policy</Link>
        </motion.div>
      </main>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white/90 backdrop-blur-2xl border border-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><BookOpen className="text-bsg-blue" /> Terms & Conditions</h2>
                <button onClick={() => setShowTerms(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 text-gray-600 text-sm space-y-4 font-medium">
                <p>Welcome to the Bharat Scouts and Guides (BSG) Portal - Vadodara Division.</p>
                <p>By using this platform, you agree to adhere strictly to the examination rules. Any attempt to switch tabs, minimize the browser, or engage in unfair means will be automatically recorded and may lead to immediate disqualification.</p>
                <p>Your data, including examination progress, is securely handled. The portal is the intellectual property of BSG, developed by Anandkumar Sharma.</p>
              </div>
              <button onClick={() => setShowTerms(false)} className="mt-6 w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors">I Understand</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}