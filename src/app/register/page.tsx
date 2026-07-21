'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Hash, Shield, MapPin, Building, Lock, Eye, EyeOff, Briefcase, Key } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'Candidate' | 'Examiner'>('Candidate');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bsgId: '',
    section: 'Scout',
    district: 'Vadodara',
    unitNumber: '',
    unitName: '',
    password: '',
    examinerCode: '',
    designation: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'bsgId' && e.target.value.length > 10) return;
    if (e.target.name === 'unitNumber' && e.target.value.length > 3) return;
    
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, ...formData });
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 w-24 h-24 bg-[#002f6c]/20 rounded-full animate-ping"></div>
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 animate-bounce border border-white/10">
            <span className="text-white font-extrabold text-3xl">BSG</span>
          </div>
        </div>
        <div className="text-[#002f6c] font-black text-lg tracking-widest animate-pulse">
          INITIALIZING...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global style to hide scrollbar but keep scrolling functionality on mobile */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="min-h-[100dvh] lg:h-screen w-full flex bg-white overflow-hidden">
        
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] text-white flex-col justify-center items-center p-12 relative h-full">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77)', backgroundSize: '40px 70px', backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px' }}></div>
          
          <div className="relative z-10 text-center max-w-[420px]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10"
            >
              <span className="text-3xl font-black text-[#fbbf24]">BSG</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-black mb-4 tracking-tight"
            >
              Join the BSG Portal
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-blue-100 text-lg font-medium leading-relaxed"
            >
              Create your account to unlock access to exclusive computer-based tests, comprehensive resources, and advanced performance analytics tailored for the Vadodara Division.
            </motion.p>
          </div>
        </div>

        {/* Right Side - Clean, Compact Form */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center items-center px-6 pt-24 pb-8 lg:p-12 relative bg-white h-[100dvh] overflow-y-auto hide-scrollbar">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[400px] relative z-10 m-auto"
          >
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-3xl font-black text-[#002f6c] mb-1">Create an Account</h2>
              <p className="text-gray-500 text-sm font-medium">Join the BSG CBT platform today</p>
            </div>

            {/* iOS Style Segmented Control */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setRole('Candidate')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'Candidate' ? 'bg-white shadow-sm text-[#002f6c]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <User size={16} /> Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('Examiner')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'Examiner' ? 'bg-white shadow-sm text-[#002f6c]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Briefcase size={16} /> Examiner
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Surname and First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                    placeholder="e.g. Sharma Anandkumar"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {role === 'Candidate' ? (
                  <motion.div
                    key="candidate-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">BSG ID</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="bsgId"
                            value={formData.bsgId}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 10) setFormData({ ...formData, bsgId: val });
                            }}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                            placeholder="10 digits"
                            maxLength={10}
                            minLength={10}
                            pattern="\d{10}"
                            required={role === 'Candidate'}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Section</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors appearance-none"
                          >
                            <option value="Scout">Scout</option>
                            <option value="Guide">Guide</option>
                            <option value="Rover">Rover</option>
                            <option value="Ranger">Ranger</option>
                            <option value="Leader">Leader</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">District</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 outline-none appearance-none cursor-not-allowed text-gray-600"
                            tabIndex={-1}
                          >
                            <option value="Vadodara">Vadodara</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Unit Number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="unitNumber"
                            value={formData.unitNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 3) setFormData({ ...formData, unitNumber: val });
                            }}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                            placeholder="e.g. 033"
                            maxLength={3}
                            required={role === 'Candidate'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Unit/Group Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="unitName"
                          value={formData.unitName}
                          onChange={handleChange}
                          className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                          placeholder="e.g. NAIR, B.P Group"
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="examiner-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Designation</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                            placeholder="e.g. Scout Master"
                            required={role === 'Examiner'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">District</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 outline-none appearance-none cursor-not-allowed text-gray-600"
                            tabIndex={-1}
                          >
                            <option value="Vadodara">Vadodara</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Access Code</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="examinerCode"
                          value={formData.examinerCode}
                          onChange={handleChange}
                          className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                          placeholder="Provided by Admin"
                          required={role === 'Examiner'}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50 outline-none transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#002f6c] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#002f6c] hover:bg-[#001f4d] active:scale-[0.98] text-white font-bold py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center text-sm"
                >
                  Register as {role}
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 font-medium pt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-[#002f6c] font-bold hover:underline">
                  Sign in here
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}