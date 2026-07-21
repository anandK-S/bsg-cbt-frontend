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
    // Enforce digit constraints strictly on change for specific fields
    if (e.target.name === 'bsgId' && e.target.value.length > 10) return;
    if (e.target.name === 'unitNumber' && e.target.value.length > 3) return;
    
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, ...formData });
    // Execute registration logic securely passing the role and validated inputs
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 w-24 h-24 bg-[#002f6c]/20 rounded-full animate-ping"></div>
          <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 animate-bounce">
            <span className="text-white font-extrabold text-2xl">BSG</span>
          </div>
        </div>
        <div className="text-[#002f6c] font-black text-lg tracking-widest animate-pulse">
          INITIALIZING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] lg:h-screen w-full flex bg-white lg:overflow-hidden">
      
      {/* Left Side - Strategic Branding Pane (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] text-white flex-col justify-center items-center p-12 relative h-full">
        {/* Geometric aesthetic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77)', backgroundSize: '40px 70px', backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px' }}></div>
        
        <div className="relative z-10 text-center max-w-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10"
          >
            <span className="text-2xl font-black text-[#fbbf24]">BSG</span>
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

      {/* Right Side - Dynamic Registration Form */}
      {/* Optimized padding and alignment for both mobile and expansive desktop displays */}
      <div className="w-full lg:w-7/12 flex items-center justify-center px-4 py-24 sm:px-8 lg:p-12 relative bg-white h-[100dvh] overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[36rem] relative z-10 m-auto"
        >
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-3xl font-black text-[#002f6c] mb-1.5 tracking-tight">Create an Account</h2>
            <p className="text-gray-500 text-sm font-medium">Join the official BSG CBT platform today</p>
          </div>

          {/* Interactive Role Toggle */}
          <div className="flex p-1.5 bg-gray-50 rounded-xl mb-6 border border-gray-200 shadow-inner">
            <button
              type="button"
              onClick={() => setRole('Candidate')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Candidate' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/60 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <User size={16} /> Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('Examiner')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Examiner' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/60 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Briefcase size={16} /> Examiner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Surname and First Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><User size={16} /></div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                    placeholder="e.g. Sharma Anandkumar"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Mail size={16} /></div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role-Specific Fields Container */}
            <AnimatePresence mode="wait">
              {role === 'Candidate' ? (
                <motion.div
                  key="candidate-fields"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">BSG ID</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Hash size={16} /></div>
                        <input
                          type="text"
                          name="bsgId"
                          value={formData.bsgId}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); // Ensure only numbers are typed
                            if (val.length <= 10) setFormData({ ...formData, bsgId: val });
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                          placeholder="Exactly 10 digits"
                          maxLength={10}
                          minLength={10}
                          pattern="\d{10}"
                          title="BSG ID must be exactly 10 digits"
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Section</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Shield size={16} /></div>
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm appearance-none shadow-sm cursor-pointer"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><MapPin size={16} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-medium text-gray-900 text-sm appearance-none cursor-not-allowed text-opacity-80 shadow-sm"
                          tabIndex={-1}
                        >
                          <option value="Vadodara">Vadodara</option>
                        </select>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Unit Number</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Hash size={16} /></div>
                        <input
                          type="text"
                          name="unitNumber"
                          value={formData.unitNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 3) setFormData({ ...formData, unitNumber: val });
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                          placeholder="e.g. 033"
                          maxLength={3}
                          minLength={1}
                          pattern="\d{1,3}"
                          title="Unit Number must be up to 3 digits"
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Unit/Group Name</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Building size={16} /></div>
                      <input
                        type="text"
                        name="unitName"
                        value={formData.unitName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                        placeholder="e.g. NAIR, B.P Group"
                        required={role === 'Candidate'}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="examiner-fields"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Designation</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Briefcase size={16} /></div>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                          placeholder="e.g. Scout Master"
                          required={role === 'Examiner'}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><MapPin size={16} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none font-medium text-gray-900 text-sm appearance-none cursor-not-allowed text-opacity-80 shadow-sm"
                          tabIndex={-1}
                        >
                          <option value="Vadodara">Vadodara</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Examiner Access Code</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Key size={16} /></div>
                      <input
                        type="password"
                        name="examinerCode"
                        value={formData.examinerCode}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                        placeholder="Provided exclusively by Admin"
                        required={role === 'Examiner'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-[#002f6c] transition-colors">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"><Lock size={16} /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-[#002f6c] transition-colors focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#002f6c] hover:bg-[#001f4d] active:scale-[0.99] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl mt-6 flex items-center justify-center gap-2 text-[15px]"
            >
              Secure Registration as {role}
            </button>

            <p className="text-center text-sm text-gray-600 font-medium mt-6">
              Already possess an account?{' '}
              <Link href="/login" className="text-[#002f6c] font-black hover:underline underline-offset-2 transition-all">
                Access Portal
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}