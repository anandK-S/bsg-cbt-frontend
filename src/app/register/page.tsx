'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Hash, Shield, MapPin, Building, Lock, Eye, EyeOff, Briefcase, Key, Award, CheckCircle2 } from 'lucide-react';

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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 w-24 h-24 bg-[#002f6c]/20 rounded-full animate-ping"></div>
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 animate-bounce border border-white/10">
            <span className="text-white font-extrabold text-3xl">BSG</span>
          </div>
        </div>
        <div className="text-[#002f6c] font-black text-lg tracking-widest animate-pulse">
          INITIALIZING PORTAL...
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Main Viewport Container Locked to Single Screen */}
      <div className="h-screen w-screen flex bg-white overflow-hidden font-sans">
        
        {/* Left Professional Brand Showcase Panel */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-4/12 bg-[#002f6c] text-white flex-col justify-between p-10 xl:p-14 relative h-full select-none">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff)', backgroundSize: '40px 70px' }}></div>
          
          {/* Top Brand Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-[#fbbf24] font-black text-xl">BSG</span>
            </div>
            <div>
              <span className="block font-black text-lg tracking-wide text-white">Vadodara Division</span>
              <span className="block text-xs font-medium text-blue-200">Official Computer-Based Testing Portal</span>
            </div>
          </motion.div>

          {/* Center Value Proposition */}
          <div className="relative z-10 my-auto space-y-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 text-xs font-bold uppercase tracking-wider"
            >
              <Award size={14} className="text-[#fbbf24]" /> Secure Assessment Ecosystem
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.1]"
            >
              Excellence in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-[#fbbf24]">Scout & Guide Testing</span>
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-blue-100/90 text-sm xl:text-base font-medium leading-relaxed max-w-md"
            >
              Register your credentials to participate in official division examinations, track live evaluations, and earn verified certification.
            </motion.p>
          </div>

          {/* Bottom Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="relative z-10 flex items-center gap-6 text-xs text-blue-200 font-semibold"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#fbbf24]" /> Encrypted Data
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#fbbf24]" /> Instant Verification
            </div>
          </motion.div>
        </div>

        {/* Right Dynamic Form Workspace Panel */}
        <div className="w-full lg:w-7/12 xl:w-8/12 flex flex-col justify-center items-center px-6 py-8 sm:px-12 lg:px-16 xl:px-24 relative bg-white h-full overflow-y-auto hide-scrollbar">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[480px] my-auto"
          >
            {/* Form Title Heading */}
            <div className="mb-5 text-left">
              <h2 className="text-2xl xl:text-3xl font-black text-[#002f6c] tracking-tight mb-1">Create Account</h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Select your portal role to initialize registration</p>
            </div>

            {/* Professional Role Selection Tab Control */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-5 border border-gray-200 shadow-inner">
              <button
                type="button"
                onClick={() => setRole('Candidate')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Candidate' ? 'bg-white shadow-md text-[#002f6c] border border-gray-200/60 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <User size={16} /> Candidate Profile
              </button>
              <button
                type="button"
                onClick={() => setRole('Examiner')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Examiner' ? 'bg-white shadow-md text-[#002f6c] border border-gray-200/60 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Briefcase size={16} /> Examiner Portal
              </button>
            </div>

            {/* Form Inputs Container */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Surname and First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                      placeholder="e.g. Sharma Anandkumar"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {role === 'Candidate' ? (
                  <motion.div
                    key="candidate-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">BSG ID (10 Digits)</label>
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
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                            placeholder="10-digit unique ID"
                            maxLength={10}
                            minLength={10}
                            required={role === 'Candidate'}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Section</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm appearance-none"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">District</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 outline-none appearance-none cursor-not-allowed text-gray-600 font-medium shadow-sm"
                            tabIndex={-1}
                          >
                            <option value="Vadodara">Vadodara</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Unit Number (3 Digits)</label>
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
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                            placeholder="e.g. 033"
                            maxLength={3}
                            required={role === 'Candidate'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Unit/Group Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="unitName"
                          value={formData.unitName}
                          onChange={handleChange}
                          className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
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
                    transition={{ duration: 0.25 }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Designation</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                            placeholder="e.g. Scout Master"
                            required={role === 'Examiner'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">District</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-400" />
                          </div>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 outline-none appearance-none cursor-not-allowed text-gray-600 font-medium shadow-sm"
                            tabIndex={-1}
                          >
                            <option value="Vadodara">Vadodara</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Examiner Access Code</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="examinerCode"
                          value={formData.examinerCode}
                          onChange={handleChange}
                          className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                          placeholder="Provided securely by Admin"
                          required={role === 'Examiner'}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] text-sm bg-gray-50/50 outline-none transition-all font-medium text-gray-900 shadow-sm"
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

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full bg-[#002f6c] hover:bg-[#001f4d] active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center text-sm"
                >
                  Register as {role}
                </button>
              </div>

              <p className="text-center text-xs text-gray-600 font-medium pt-1">
                Already have an account?{' '}
                <Link href="/login" className="text-[#002f6c] font-black hover:underline">
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