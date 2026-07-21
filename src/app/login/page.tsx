'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import '@/utils/apiConfig';
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
  const [error, setError] = useState<{ message: string, platformName?: string, supportEmail?: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    axios.get(`${API_URL}/api/settings`).then((res) => {
      setGlobalSettings(res.data);
    }).catch(console.error);
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
      const { data } = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      login(data);

      if (data.role === 'Admin') {
        router.push('/admin');
      } else if (data.role === 'Examiner') {
        router.push('/examiner');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError({
          message: err.response.data.message || 'Login failed.',
          platformName: err.response.data.platformName,
          supportEmail: err.response.data.supportEmail
        });
      } else {
        setError({ message: 'Login failed. Please try again.' });
      }
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
    <div className="flex-1 bg-background flex min-h-screen relative overflow-hidden">
      {/* Left Decorative Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-bsg-blue-dark via-bsg-blue to-bsg-blue-light items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-bsg-gold/20 blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-white px-12 text-center">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="font-extrabold text-bsg-gold text-4xl">BSG</span>
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">Welcome to the Future of Assessment</h1>
          <p className="text-lg text-blue-100 max-w-md font-medium">Experience a seamless, secure, and intuitive computer-based testing environment designed for excellence.</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 relative z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-bsg-blue/10 blur-[100px] pointer-events-none lg:hidden" />
        
        <div className="mx-auto w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left mb-8"
          >
            <div className="flex justify-center lg:hidden mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-xl transform -rotate-3">
                <span className="font-extrabold text-white text-2xl">BSG</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {t("welcomeBack")}
            </h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {t("signInToAccount")}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="glass-card py-8 px-6 sm:px-10 rounded-3xl">
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
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  Email Address or BSG ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="text"
                    required
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
                    placeholder={t("enterEmail")}
                    value={email}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (/^\d+$/.test(val)) {
                        val = val.slice(0, 8);
                      }
                      setEmail(val);
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
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
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm font-semibold text-bsg-blue hover:text-bsg-blue-dark transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
              
              {(globalSettings?.termsUrl || globalSettings?.privacyUrl) && (
                <div className="flex items-start mt-4">
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
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full sm:w-1/3 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-2/3 flex justify-center items-center gap-2 bg-gradient-to-r from-bsg-blue to-bsg-blue-light hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm disabled:opacity-70 transform active:scale-95"
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
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center text-sm">
            <span className="text-gray-500">{t("dontHaveAccount")} </span>
            <Link href="/register" className="text-bsg-blue dark:text-bsg-gold font-bold hover:underline transition-all">
              {t("register")}
            </Link>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <Mail className="h-8 w-8 text-bsg-blue" />
            </div>
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Forgot Password?</h3>
            <p className="text-center text-gray-600 mb-8 leading-relaxed">
              Please contact your <strong className="text-gray-900">Administrator</strong> to have your password reset. They can generate a new password for you from the Admin Dashboard.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
    </>
  );
}
