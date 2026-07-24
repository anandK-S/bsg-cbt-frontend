'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: any } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [envWarning, setEnvWarning] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch global settings directly from Supabase
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('*').limit(1).single();
        if (data) setGlobalSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings(); 

    // Diagnostics check to see if Supabase env variables are actually present in the browser
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.length < 5 || url.includes('missing')) {
      setEnvWarning(true);
    }

    const savedEmail = localStorage.getItem('rememberMeEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (globalSettings?.termsUrl && !agreeTerms) {
      setError({ message: 'You must agree to the Terms & Privacy Policy to login.' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed.');

      // 2. Fetch full profile from the 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error('Failed to load user profile.');
      }

      if (profile.status === 'Blocked') {
        throw new Error('User is blocked');
      }

      if (globalSettings?.maintenance_mode && profile.role !== 'Admin') {
        throw new Error('Maintenance Mode');
      }

      // Update last_login
      await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', authData.user.id);

      // 3. Update Zustand Store
      const userData = {
        _id: authData.user.id,
        name: profile.name,
        email: authData.user.email as string,
        role: profile.role,
        bsgId: profile.bsg_id,
        section: profile.section,
        district: profile.district,
        unitNumber: profile.unit_number,
        unitName: profile.unit_name,
        profileImage: profile.profile_image,
        token: authData.session?.access_token,
      };

      login(userData);

      if (rememberMe) {
        localStorage.setItem('rememberMeEmail', email);
      } else {
        localStorage.removeItem('rememberMeEmail');
      }

      if (profile.role === 'Admin') {
        router.push('/admin');
      } else if (profile.role === 'Examiner') {
        router.push('/examiner');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Login failed. Please try again.';
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = language === 'hi' ? 'गलत ईमेल या पासवर्ड!' : 'Wrong Email or Password!';
      } else if (errorMessage.includes('User is blocked')) {
        errorMessage = language === 'hi' ? 'आपका खाता ब्लॉक कर दिया गया है।' : 'Your account has been blocked.';
      } else if (errorMessage.includes('Failed to load user profile')) {
        errorMessage = language === 'hi' ? 'तकनीकी त्रुटि! कृपया बाद में प्रयास करें।' : 'Technical Error! Failed to load profile.';
      } else if (errorMessage.includes('Maintenance Mode')) {
        errorMessage = language === 'hi' ? 'सिस्टम अभी मेंटेनेंस मोड में है। कृपया बाद में प्रयास करें।' : 'System is currently under maintenance. Please try again later.';
      }
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !_hasHydrated) return null;

  return (
    <>
    {loading && (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
        <div className="w-16 h-16 border-4 border-bsg-blue/30 border-t-bsg-blue rounded-full animate-spin shadow-lg"></div>
        <p className="mt-4 text-lg font-bold text-bsg-blue animate-pulse">Logging in...</p>
      </div>
    )}
    <div className="flex-1 flex flex-col lg:flex-row min-h-full bg-white">
      {/* Left Panel: Hero Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B1B3D] items-center justify-center overflow-hidden">
        {/* Deep immersive background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B3D] via-[#112A5E] to-[#1A3F8C] opacity-90"></div>
        
        {/* Animated Glowing Orbs */}
        <motion.div animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#FFC107]/20 blur-[120px] pointer-events-none" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#4A90E2]/20 blur-[150px] pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#FFFFFF]/10 blur-[100px] pointer-events-none" />
        
        {/* Animated Grid / Tech Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center text-white px-8 lg:px-16 text-center h-full pt-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(255,193,7,0.3)] border border-white/20 transform rotate-3 transition-all duration-300 cursor-default"
          >
            <span className="font-extrabold text-[#FFC107] text-6xl tracking-tighter drop-shadow-lg">BSG</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight drop-shadow-md">
            {t("welcomeTo") || "Welcome to the"}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC107] to-[#FFF0B3]">{t("welcomeToFutureOfAssessment")?.split(' ').slice(3).join(' ') || "Future of Assessment"}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg lg:text-xl text-blue-100/90 max-w-md font-medium leading-relaxed mb-16">
            {t("seamlessExperienceDesc") || "Experience a seamless, secure, and intuitive computer-based testing environment designed for excellence."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
            className="group relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-sm mt-auto mb-12 transition-all duration-300 cursor-default"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <p className="text-blue-100/80 italic font-medium">"Be Prepared."</p>
            <p className="text-bsg-gold text-sm font-bold mt-2 tracking-widest uppercase">— Bharat Scouts and Guides</p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Clean Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-xl transform -rotate-3">
              <span className="font-extrabold text-white text-2xl">BSG</span>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center lg:text-left"
          >
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {t("welcomeBack")}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {t("dontHaveAccount") || "Don't have an account?"} <Link href="/register" className="text-bsg-blue font-bold hover:underline transition-all">{t("register") || "Register"}</Link>
            </p>
          </motion.div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${error.supportEmail ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-500/10 text-red-500 border-red-500/20'} p-4 rounded-xl border flex flex-col gap-2 font-medium text-sm`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${error.supportEmail ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="font-bold">{error.platformName ? `${error.platformName} is Under Maintenance` : 'Error'}</span>
                </div>
                <p>{error.message}</p>
                {error.supportEmail && (
                  <p className="mt-2 text-xs font-bold bg-amber-100 p-2 rounded-lg text-amber-900 inline-block text-center border border-amber-200">
                    Contact Support: {error.supportEmail}
                  </p>
                )}
              </motion.div>
            )}

            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1.5">
                  {t("emailOrBsgId") || "Email Address or BSG ID"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="text"
                    required
                    autoComplete="email"
                    className="block w-full pl-11 pr-3 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm shadow-sm"
                    placeholder="e.g. name@example.com or 12345678"
                    value={email}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (/^\d+$/.test(val)) {
                        val = val.slice(0, 10);
                      }
                      setEmail(val);
                    }}
                  />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="block w-full pl-11 pr-10 py-3.5 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-bsg-blue bg-gray-100 border-gray-300 rounded focus:ring-bsg-blue focus:ring-2 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-medium cursor-pointer select-none">
                      {t("rememberMe") || "Remember Me"}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm font-semibold text-bsg-blue hover:text-bsg-blue-dark transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </motion.div>
              
              {(globalSettings?.termsUrl || globalSettings?.privacyUrl) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-start mt-4">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 text-bsg-blue bg-gray-100 border-gray-300 rounded focus:ring-bsg-blue focus:ring-2"
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I agree to the{' '}
                      {globalSettings?.termsUrl && (
                        <a href={globalSettings.termsUrl} target="_blank" rel="noreferrer" className="text-bsg-blue hover:underline">
                          Terms & Conditions
                        </a>
                      )}
                      {globalSettings?.termsUrl && globalSettings?.privacyUrl && ' and '}
                      {globalSettings?.privacyUrl && (
                        <a href={globalSettings.privacyUrl} target="_blank" rel="noreferrer" className="text-bsg-blue hover:underline">
                          Privacy Policy
                        </a>
                      )}
                    </label>
                  </div>
                </motion.div>
              )}
            </div>

          {envWarning && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 rounded-md">
              <h3 className="font-bold mb-1">Missing Environment Variables!</h3>
              <p className="text-sm">Vercel is missing your Supabase URL. Please go to Vercel Settings &gt; Environment Variables, add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, ensure they are checked for <b>Production</b>, and click Redeploy.</p>
            </div>
          )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 flex flex-col sm:flex-row gap-4"
            >
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full sm:w-1/3 flex justify-center items-center py-3.5 px-4 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-2/3 flex justify-center items-center gap-2 bg-gradient-to-r from-bsg-blue to-bsg-blue-light hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm disabled:opacity-70 transform active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    {t("signIn")} <LogIn size={18} />
                  </>
                )}
              </button>
            </motion.div>
          </form>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 pt-6 border-t border-gray-100 text-center text-sm">
            <span className="text-gray-500 font-medium">{t("dontHaveAccount")} </span>
            <Link href="/register" className="text-bsg-blue font-black hover:text-bsg-blue-dark hover:underline transition-all">
              {t("register")}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <Mail className="h-8 w-8 text-bsg-blue" />
            </div>
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2">{t("forgotPasswordTitle") || "Forgot Password?"}</h3>
            <p className="text-center text-gray-600 mb-8 leading-relaxed">
              {t("forgotPasswordDesc") || "Please contact Anand to have your password reset. They can generate a new password for you from the Admin Dashboard."}
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              {t("gotIt") || "Got it, thanks!"}
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
