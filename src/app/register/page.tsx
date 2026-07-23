'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
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
  const [section, setSection] = useState('');
  const [district, setDistrict] = useState('Vadodara');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitName, setUnitName] = useState('');
  const [registerType, setRegisterType] = useState<'Candidate' | 'Examiner'>('Candidate');
  const [examinerCode, setExaminerCode] = useState('');
  const [rank, setRank] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

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
    setGlobalSettings(null);
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
    if (password.length < 6) {
      setError({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Determine User Role
      let role = 'Candidate';
      if (registerType === 'Examiner') {
        if (examinerCode !== 'EXAM2024') { // Mock validation, adjust as needed
          throw new Error('Invalid Examiner Code');
        }
        role = 'Examiner';
      }

      // 2. Register User via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed. Please try again.');

      // 3. The SQL trigger automatically creates the base profile.
      // Now we update the profile with the rest of the metadata.
      const profileUpdate: any = {};
      if (registerType === 'Candidate') {
        profileUpdate.bsg_id = bsgId;
        profileUpdate.section = section;
        profileUpdate.district = district;
        profileUpdate.unit_number = unitNumber;
        profileUpdate.unit_name = unitName;
      } else if (registerType === 'Examiner') {
        profileUpdate.rank = rank;
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', data.user.id);
          
        if (profileError) throw profileError;
      }

      // 4. Update local Zustand Store
      const userData = {
        _id: data.user.id,
        name,
        email,
        role: role as 'Candidate' | 'Examiner' | 'Admin',
        bsgId: registerType === 'Candidate' ? bsgId : undefined,
        district: registerType === 'Candidate' ? district : undefined,
        unitNumber: registerType === 'Candidate' ? unitNumber : undefined,
        unitName: registerType === 'Candidate' ? unitName : undefined,
        token: data.session?.access_token,
      };

      login(userData);

      if (role === 'Admin') {
        router.push('/admin');
      } else if (role === 'Examiner') {
        router.push('/examiner');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Registration failed. Please try again.';
      if (errorMessage.includes('User already registered')) {
        errorMessage = language === 'hi' ? 'यह ईमेल पहले से ही पंजीकृत है।' : 'This email is already registered. Please login.';
      } else if (errorMessage.includes('Invalid Examiner Code')) {
        errorMessage = language === 'hi' ? 'अमान्य परीक्षक कोड।' : 'Invalid Examiner Code.';
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
          <p className="mt-4 text-lg font-bold text-bsg-blue animate-pulse">Creating your account...</p>
        </div>
      )}
      
      <div className="flex-1 flex flex-col lg:flex-row min-h-full bg-white">
        {/* Left Panel: Hero Graphic */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-[#0B1B3D] items-center justify-center overflow-hidden">
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
              {t("joinBsgPortalLeft") || "Join the BSG Portal"}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg lg:text-xl text-blue-100/90 max-w-md font-medium leading-relaxed mb-16">
              {t("createAccountDesc") || "Create your account to unlock access to exclusive computer-based tests and resources."}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-sm mt-auto mb-12 transition-all duration-300 cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <p className="text-blue-100/80 italic font-medium">"Creating a better world through education, empowerment, and character."</p>
              <p className="text-bsg-gold text-sm font-bold mt-2 tracking-widest uppercase">— Bharat Scouts and Guides</p>
            </motion.div>
          </div>
        </div>

        {/* Right Panel: Clean Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 xl:px-24 relative z-10 bg-white py-12">
          <div className="w-full max-w-xl mx-auto">
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
                {t("createAccount")}
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-medium">
                {t("alreadyHaveAccount") || "Already have an account?"} <Link href="/login" className="text-bsg-blue font-bold hover:underline transition-all">{t("loginHere") || "Login here"}</Link>
              </p>
            </motion.div>

            <form className="space-y-4" onSubmit={handleSubmit}>
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

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex bg-gray-100/80 p-1.5 rounded-xl mb-6 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setRegisterType('Candidate')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${registerType === 'Candidate' ? 'bg-white text-bsg-blue shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                      {t("candidate") || "Candidate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterType('Examiner')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${registerType === 'Examiner' ? 'bg-white text-bsg-blue shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                      {t("examiner") || "Examiner"}
                    </button>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="md:col-span-1">
                      <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-1.5">{t("fullName")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <User size={18} />
                        </div>
                        <input
                          id="name"
                          type="text"
                          required
                          className="block w-full pl-11 pr-3 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
                          placeholder={t("enterFullName")}
                          value={name}
                          onChange={(e) => setName(capitalizeWords(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">{t("emailAddress")}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <Mail size={18} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          required
                          className="block w-full pl-11 pr-3 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
                          placeholder={t("enterEmail")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

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
                          className="block w-full pl-11 pr-3 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
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
                          className="block w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base appearance-none shadow-sm"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                        >
                          <option value="" disabled>{t("selectSection") || "Select"}</option>
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
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
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
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
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
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
                        placeholder="e.g. NAIR, B.P Group"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                      />
                    </div>
                    {registerType === 'Examiner' && (
                      <>
                        <div className="md:col-span-2">
                          <label htmlFor="rank" className="block text-sm font-semibold text-foreground mb-1.5">{t("rank") || "Rank"}</label>
                          <input
                            id="rank"
                            type="text"
                            required
                            className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
                            placeholder="e.g. Scout Master"
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                        <label htmlFor="examinerCode" className="block text-sm font-semibold text-foreground mb-1.5">{t("secretCode") || "Secret Code"}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                            <Lock size={18} />
                          </div>
                          <input
                            id="examinerCode"
                            type={showSecretCode ? 'text' : 'password'}
                            required
                            className="block w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
                            placeholder={t("enterSecretCode") || "Enter Examiner Secret Code"}
                            value={examinerCode}
                            onChange={(e) => setExaminerCode(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecretCode(!showSecretCode)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                          >
                            {showSecretCode ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="password" className="block text-sm font-semibold text-foreground">{t("password")}</label>
                        <button type="button" onClick={generatePassword} className="text-xs font-bold text-bsg-blue hover:text-bsg-blue-dark transition-colors">{t("suggestPassword") || "Suggest Password"}</button>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                          <Lock size={18} />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="block w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-bsg-blue/10 focus:border-bsg-blue transition-all font-medium text-sm sm:text-base shadow-sm"
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
                
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 pt-6 border-t border-gray-100 text-center text-sm">
              <span className="text-gray-500 font-medium">{t("alreadyHaveAccount")} </span>
              <Link href="/login" className="text-bsg-blue font-black hover:text-bsg-blue-dark hover:underline transition-all">
                {t("signIn")}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}