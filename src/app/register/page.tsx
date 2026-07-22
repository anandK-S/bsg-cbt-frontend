'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, BadgeInfo, UserPlus, ShieldCheck } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bsgId, setBsgId] = useState('');
  const [section, setSection] = useState('Scout');
  const [district, setDistrict] = useState('Vadodara');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitName, setUnitName] = useState('');
  const [registerType, setRegisterType] = useState<'Candidate' | 'Examiner'>('Candidate');
  const [examinerCode, setExaminerCode] = useState('');
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.match(/[a-z]+/)) strength += 1;
    if (pass.match(/[A-Z]+/)) strength += 1;
    if (pass.match(/[0-9]+/)) strength += 1;
    if (pass.match(/[$@#&!]+/)) strength += 1;

    if (strength <= 2) return { label: t("weak") || "Weak", color: "text-red-500", bg: "bg-red-500", w: "w-1/3" };
    if (strength <= 4) return { label: t("medium") || "Medium", color: "text-amber-500", bg: "bg-amber-500", w: "w-2/3" };
    return { label: t("strong") || "Strong", color: "text-green-500", bg: "bg-green-500", w: "w-full" };
  };
  const [error, setError] = useState<{ message: string, platformName?: string, supportEmail?: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    axios.get(`${API_URL}/api/settings`).then((res) => {
      setGlobalSettings(res.data);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSettings?.termsUrl && !agreeTerms) {
      setError({ message: 'You must agree to the Terms & Privacy Policy to register.' });
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      setError({ message: 'Name can only contain letters and spaces (no special characters or numbers).' });
      return;
    }

    if (registerType === 'Candidate') {
      const bsgIdRegex = /^\d{8,10}$/;
      if (!bsgIdRegex.test(bsgId)) {
        setError({ message: 'BSG ID must be between 8 and 10 digits.' });
        return;
      }
    }
    
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError({ message: 'Password must be at least 6 characters and contain a letter, a number, and a special character.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = { name, email, password };
      if (registerType === 'Candidate') {
        payload.bsgId = bsgId;
        payload.section = section;
        payload.district = district;
        payload.unitNumber = unitNumber;
        payload.unitName = unitName;
      } else {
        payload.examinerCode = examinerCode;
      }

      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        payload,
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
          message: err.response.data.message || 'Registration failed. Please try again.',
          platformName: err.response.data.platformName,
          supportEmail: err.response.data.supportEmail
        });
      } else {
        setError({ message: 'Registration failed. Please try again.' });
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
          <p className="mt-4 text-lg font-bold text-bsg-blue animate-pulse">Creating your account...</p>
        </div>
      )}
      
      <div className="flex-1 bg-background flex min-h-[100dvh] relative lg:overflow-hidden">
        
        {/* Left Decorative Panel (Hidden on Mobile) */}
        {/* Added pt-20 to clear the global header on desktop */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-gradient-to-br from-bsg-blue-dark via-bsg-blue to-bsg-blue-light items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-bsg-gold/20 blur-[120px] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-white px-12 text-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="font-extrabold text-bsg-gold text-4xl">BSG</span>
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">Join the BSG Portal</h1>
            <p className="text-lg text-blue-100 max-w-md font-medium">Create your account to unlock access to exclusive computer-based tests and resources.</p>
          </div>
        </div>

        {/* Right Register Panel */}
        {/* Added pt-28 lg:pt-32 pb-12 to perfectly position form below the global header on PC */}
        <div className="flex-1 flex flex-col justify-center pt-28 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-20 relative z-10 lg:h-screen lg:overflow-y-auto custom-scrollbar">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-bsg-blue/10 blur-[100px] pointer-events-none lg:hidden" />
          
          <div className="mx-auto w-full max-w-lg my-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left mb-6"
            >
              <div className="flex justify-center lg:hidden mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-xl transform rotate-3">
                  <span className="font-extrabold text-white text-2xl">BSG</span>
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {t("createAccount")}
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-medium">
                {t("joinBsgPortal")}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="glass-card py-6 px-4 sm:p-8 rounded-3xl">
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

                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => setRegisterType('Candidate')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${registerType === 'Candidate' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t("candidate") || "Candidate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterType('Examiner')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${registerType === 'Examiner' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t("examiner") || "Examiner"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-1.5">{t("fullName")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <User size={18} />
                        </div>
                        <input
                          id="name"
                          type="text"
                          required
                          className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base"
                          placeholder={t("enterFullName")}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">{t("emailAddress")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <Mail size={18} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base"
                          placeholder={t("enterEmail")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {registerType === 'Candidate' ? (
                      <>
                        <div>
                      <label htmlFor="bsgId" className="block text-sm font-semibold text-foreground mb-1.5">{t("bsgId")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <BadgeInfo size={18} />
                        </div>
                        <input
                          id="bsgId"
                          type="text"
                          required
                          maxLength={10}
                          className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base"
                          placeholder={t("enterBsgId")}
                          value={bsgId}
                          onChange={(e) => setBsgId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="section" className="block text-sm font-semibold text-foreground mb-1.5">Section</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <ShieldCheck size={18} />
                        </div>
                        <select
                          id="section"
                          required
                          className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base appearance-none"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                        >
                          <option value="Scout">Scout</option>
                          <option value="Guide">Guide</option>
                          <option value="Rover">Rover</option>
                          <option value="Ranger">Ranger</option>
                          <option value="Leader">Leader</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="district" className="block text-sm font-semibold text-foreground mb-1.5">{t("district")}</label>
                      <select
                        id="district"
                        required
                        className="block w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bsg-blue transition-all text-sm sm:text-base"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      >
                        <option value="Vadodara">Vadodara</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="unitNumber" className="block text-sm font-semibold text-foreground mb-1.5">Unit/Group Number</label>
                      <input
                        id="unitNumber"
                        type="number"
                        required
                        className="block w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue transition-all text-sm sm:text-base"
                        placeholder="e.g. 33"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="unitName" className="block text-sm font-semibold text-foreground mb-1.5">Unit/Group Name</label>
                      <input
                        id="unitName"
                        type="text"
                        required
                        className="block w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue transition-all text-sm sm:text-base"
                        placeholder="e.g. NAIR, B.P Group"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label htmlFor="examinerCode" className="block text-sm font-semibold text-foreground mb-1.5">{t("secretCode") || "Secret Code"}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        id="examinerCode"
                        type="password"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder={t("enterSecretCode") || "Enter Examiner Secret Code"}
                        value={examinerCode}
                        onChange={(e) => setExaminerCode(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                    <div className="md:col-span-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">{t("password")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <Lock size={18} />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="block w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all text-sm sm:text-base"
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
                      {password && (
                        <div className="mt-2 mb-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-500">{t("passwordStrength")}</span>
                            <span className={`text-xs font-bold ${getPasswordStrength(password)?.color}`}>{getPasswordStrength(password)?.label}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                            <div className={`h-full ${getPasswordStrength(password)?.bg} ${getPasswordStrength(password)?.w} transition-all duration-300`}></div>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 mt-1">Include a letter, number, and special character</p>
                    </div>

                    {(globalSettings?.termsUrl || globalSettings?.privacyUrl) && (
                      <div className="md:col-span-2 flex items-start mt-2">
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

                  <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="w-full sm:w-1/3 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue transition-colors"
                    >
                      {t("cancel") || "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-2/3 flex justify-center items-center gap-2 bg-gradient-to-r from-bsg-blue to-bsg-blue-light hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm disabled:opacity-70 transform active:scale-95"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Registering...
                        </span>
                      ) : (
                        <>
                          {t("createAccount")} <UserPlus size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
                
                <div className="mt-6 pt-6 border-t border-border text-center text-sm">
                  <span className="text-gray-500">{t("alreadyHaveAccount")} </span>
                  <Link href="/login" className="text-bsg-blue dark:text-bsg-gold font-bold hover:underline transition-all">
                    {t("signIn")}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}