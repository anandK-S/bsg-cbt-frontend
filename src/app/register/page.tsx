'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import axios from 'axios';
import '@/utils/apiConfig';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, BadgeInfo, UserPlus, ShieldCheck } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bsgId, setBsgId] = useState('');
  const [section, setSection] = useState('Scout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/register',
        { name, email, password, bsgId, section },
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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
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
    <div className="flex-1 bg-background flex flex-col py-6 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-bsg-blue/20 dark:bg-bsg-blue/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-bsg-gold/10 dark:bg-bsg-gold/20 blur-[100px] pointer-events-none" />

      <div className="m-auto w-full max-w-lg">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-xl transform rotate-3">
            <UserPlus size={28} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Join the BSG CBT Portal
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10"
      >
        <div className="bg-card/80 backdrop-blur-xl py-6 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 text-red-500 p-3 rounded-xl border border-red-500/20 text-sm flex items-center gap-2 font-medium"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-1.5">Surname and First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
                    placeholder="Surname First Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bsgId" className="block text-sm font-semibold text-foreground mb-1.5">BSG ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <BadgeInfo size={18} />
                  </div>
                  <input
                    id="bsgId"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
                    placeholder="BSG-xxxx"
                    value={bsgId}
                    onChange={(e) => setBsgId(e.target.value)}
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm appearance-none"
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

              <div className="md:col-span-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-bsg-blue transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all sm:text-sm"
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
              </div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.back()}
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
                    Registering...
                  </span>
                ) : (
                  <>
                    Create Account <UserPlus size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link href="/login" className="text-bsg-blue dark:text-bsg-gold font-bold hover:underline transition-all">
              Sign In
            </Link>
          </div>
        </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
