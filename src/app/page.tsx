'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Brain, ChevronRight, X, BookOpen, Code, Trophy, Star } from 'lucide-react';

const TypewriterText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <motion.span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: index * 0.05 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default function Home() {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const { language, setLanguage, t } = useLanguage();
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
      <div className="min-h-screen flex items-center justify-center bg-[#0B1B3D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-32 h-32 bg-bsg-gold/20 rounded-full animate-ping"></div>
          <div className="relative z-10 w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,193,7,0.3)] transform rotate-3 animate-bounce">
            <span className="text-bsg-gold font-extrabold text-3xl drop-shadow-lg">BSG</span>
          </div>
        </div>
      </div>
    );
  }

  const quotes = [
    { text: "Be Prepared.", top: "15%", left: "5%", delay: 0 },
    { text: "Creating a better world.", top: "45%", left: "85%", delay: 2 },
    { text: "Service to others.", top: "75%", left: "10%", delay: 4 },
    { text: "Duty to God and Country.", top: "25%", left: "75%", delay: 6 },
    { text: "Character & Health.", top: "85%", left: "80%", delay: 8 },
  ];

  return (
    <div className="min-h-screen bg-[#0B1B3D] font-sans selection:bg-bsg-gold selection:text-[#0B1B3D] overflow-hidden relative text-white">
      {/* Deep immersive background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B1B3D] via-[#112A5E] to-[#1A3F8C] opacity-90 pointer-events-none z-0"></div>
      
      {/* Animated Glowing Orbs */}
      <motion.div animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="fixed top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#FFC107]/10 blur-[120px] pointer-events-none z-0" />
      <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#4A90E2]/10 blur-[150px] pointer-events-none z-0" />
      
      {/* Animated Grid / Tech Pattern */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none z-0"></div>

      {/* Floating Quotes */}
      {quotes.map((q, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, delay: q.delay, repeat: Infinity, ease: "easeInOut" }}
          className="absolute z-0 hidden lg:block bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-xl whitespace-nowrap"
          style={{ top: q.top, left: q.left }}
        >
          <span className="text-bsg-gold/80 italic font-medium">"{q.text}"</span>
        </motion.div>
      ))}

      {/* Navbar */}
      <header className="absolute top-0 w-full z-40 px-4 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-lg">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,193,7,0.2)] transform -rotate-3">
              <span className="font-extrabold text-bsg-gold text-sm drop-shadow-md">BSG</span>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight hidden sm:block drop-shadow-sm">
              {t("bsgPortal")}
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/10">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-bsg-gold text-bsg-blue shadow-sm' : 'text-gray-300 hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-bsg-gold text-bsg-blue shadow-sm' : 'text-gray-300 hover:text-white'}`}
              >
                HI
              </button>
            </div>
            
            <Link href="/login" className="text-gray-200 hover:text-bsg-gold font-bold px-3 py-2 text-sm sm:text-base transition-colors hidden sm:block drop-shadow-sm">
              {t("signIn")}
            </Link>
            <Link href="/register" className="bg-bsg-gold hover:bg-[#FFD54F] text-[#0B1B3D] font-black px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-xl transition-all shadow-[0_4px_20px_rgba(255,193,7,0.4)] hover:shadow-[0_6px_25px_rgba(255,193,7,0.6)] hover:-translate-y-0.5">
              {t("register")}
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 pb-16 px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto flex flex-col items-center text-center mt-4 sm:mt-8">
          
          <motion.div whileHover={{ scale: 1.05 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-bsg-gold text-xs sm:text-sm font-bold mb-8 shadow-[0_0_20px_rgba(255,193,7,0.15)] backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bsg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-bsg-gold"></span>
            </span>
            Vadodara Division
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white tracking-tight leading-[1.05] mb-6 min-h-[140px] md:min-h-[180px]">
            <span className="text-gray-200">{t("welcomeTo")}</span> <br className="hidden md:block" />
            <TypewriterText text={t("bsgPortal")} className="text-transparent bg-clip-text bg-gradient-to-r from-bsg-gold to-[#FFF0B3] drop-shadow-lg" />
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }} className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-12 leading-relaxed font-medium drop-shadow-md">
            {t("landingDesc")}
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: "spring" }} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-4 sm:px-0 bg-white/5 p-3 rounded-[2rem] backdrop-blur-xl border border-white/10 shadow-2xl">
            <Link href="/login" className="group relative inline-flex items-center justify-center px-10 py-4 font-black text-[#0B1B3D] bg-bsg-gold rounded-2xl overflow-hidden transition-all hover:bg-[#FFD54F] shadow-[0_0_30px_rgba(255,193,7,0.4)] hover:-translate-y-1">
              <span className="relative z-10 flex items-center gap-2 text-lg">
                {t("startExamination")} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link href="/register" className="inline-flex items-center justify-center px-10 py-4 font-bold text-white bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all text-lg hover:-translate-y-1 backdrop-blur-md">
              {t("registration")}
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid (Glassmorphism) */}
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-24 sm:mt-32 max-w-6xl mx-auto w-full px-4 sm:px-6">
          {[
            { icon: ShieldCheck, color: 'text-bsg-gold', title: t("secureExamination"), desc: t("secureExamDesc") },
            { icon: Zap, color: 'text-cyan-400', title: t("reliableOffline"), desc: t("reliableOfflineDesc") },
            { icon: Brain, color: 'text-pink-400', title: t("instantInsights"), desc: t("instantInsightsDesc") }
          ].map((feat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
              <div className={`w-16 h-16 bg-black/20 ${feat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 border border-white/10 shadow-inner`}>
                <feat.icon size={32} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 drop-shadow-sm">{feat.title}</h3>
              <p className="text-blue-100/80 text-sm leading-relaxed font-medium">
                {feat.desc}
              </p>
            </div>
          ))}
        </motion.div>
        
        {/* Developed By Section (Massive Overhaul) */}
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="mt-32 max-w-5xl mx-auto w-full px-4 sm:px-6 mb-20 group">
          <div className="bg-black/40 backdrop-blur-2xl rounded-[3rem] p-8 sm:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-10 sm:gap-16 relative overflow-hidden text-white border border-white/10 transform transition-transform duration-500 hover:rotate-1">
            
            {/* Animated Background Sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-0"></div>
            
            <div className="relative z-10 w-full md:w-auto flex justify-center shrink-0">
              <div className="relative">
                {/* Floating Tech Badges */}
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-4 -right-4 bg-black/60 p-2.5 rounded-xl border border-white/20 shadow-xl backdrop-blur-md z-20">
                  <Code size={20} className="text-cyan-400" />
                </motion.div>
                <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 bg-black/60 p-2.5 rounded-xl border border-white/20 shadow-xl backdrop-blur-md z-20">
                  <Trophy size={20} className="text-bsg-gold" />
                </motion.div>

                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-[2.5rem] overflow-hidden border-[4px] border-bsg-gold/50 shadow-[0_0_40px_rgba(255,193,7,0.2)] bg-white/5 relative z-10 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-bsg-gold/20 mix-blend-overlay z-10 pointer-events-none"></div>
                  <img src="/anandkumar-scout.jpg" alt="Anandkumar Sharma" className="w-full h-full object-cover filter contrast-110" />
                </div>
              </div>
            </div>
            
            <div className="relative z-10 flex-1 text-center md:text-left space-y-5">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-bsg-gold/10 text-bsg-gold text-xs font-black uppercase tracking-widest border border-bsg-gold/20 shadow-sm backdrop-blur-md">
                <Star size={14} className="mr-2" /> {t("developerArchitect")}
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">{t("developerName")}</h2>
              <div className="space-y-3 mt-4 text-blue-100 font-medium text-base sm:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0">
                <p className="bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">"{t("developerDesc1")}"</p>
                <p className="text-gray-300 pl-4 border-l-4 border-bsg-gold text-left">{t("developerDesc2")}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center text-sm font-medium text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pb-8 relative z-20">
          <button onClick={() => setShowTerms(true)} className="hover:text-white bg-white/5 border border-white/10 px-6 py-3 rounded-full transition-colors flex items-center justify-center w-full sm:w-auto gap-2 backdrop-blur-md shadow-sm"><BookOpen size={16}/> {t("termsConditions")}</button>
          <Link href="/privacy" className="hover:text-white bg-white/5 border border-white/10 px-6 py-3 rounded-full transition-colors flex items-center justify-center w-full sm:w-auto gap-2 backdrop-blur-md shadow-sm"><ShieldCheck size={16}/> {t("privacyPolicy")}</Link>
        </motion.div>
      </main>
      
      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#112A5E] border border-white/20 rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col relative text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3"><BookOpen className="text-bsg-gold" /> {t("termsConditions")}</h2>
                <button onClick={() => setShowTerms(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-4 text-blue-100 text-sm space-y-4 font-medium">
                <p>Welcome to the Bharat Scouts and Guides (BSG) Portal.</p>
                <p>By using this platform, you agree to adhere strictly to the examination rules. Any attempt to switch tabs, minimize the browser, or engage in unfair means will be automatically recorded and may lead to immediate disqualification.</p>
                <p>{t("landingDesc")}</p>
              </div>
              <button onClick={() => setShowTerms(false)} className="mt-8 w-full bg-bsg-gold text-[#0B1B3D] font-black py-4 rounded-xl hover:bg-[#FFD54F] transition-colors shadow-lg">I Understand</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
