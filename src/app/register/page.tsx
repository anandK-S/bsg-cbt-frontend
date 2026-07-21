'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Hash, Shield, MapPin, Building, Lock, Eye, EyeOff, Briefcase, Key } from 'lucide-react';

export default function Register() {
  const router = useRouter();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Only allow numbers for BSG ID and Unit Number
    if ((e.target.name === 'bsgId' || e.target.name === 'unitNumber') && e.target.value !== '' && !/^\d+$/.test(e.target.value)) {
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, ...formData });
    // Add your registration logic here
  };

  return (
    <div className="min-h-screen lg:h-screen flex bg-white lg:overflow-hidden pt-20 lg:pt-0">
      
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] text-white flex-col justify-center items-center p-8 relative h-full">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77)', backgroundSize: '40px 70px', backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px' }}></div>
        
        <div className="relative z-10 text-center max-w-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl border border-white/10"
          >
            <span className="text-xl font-black text-[#fbbf24]">BSG</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-black mb-2 tracking-tight"
          >
            Join the BSG Portal
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-blue-100 text-sm font-medium leading-relaxed"
          >
            Create your account to unlock access to exclusive computer-based tests and resources.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 flex flex-col lg:items-center lg:justify-center px-5 sm:px-10 pb-10 relative bg-white lg:overflow-y-auto custom-scrollbar">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[34rem] mx-auto relative z-10"
        >
          {/* Mobile-only Branding Header */}
          <div className="lg:hidden flex flex-col items-center mb-8 mt-2">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg border border-blue-200 mb-3">
              <span className="text-lg font-black text-[#fbbf24]">BSG</span>
            </div>
            <h1 className="text-2xl font-black text-[#002f6c] tracking-tight">BSG Portal</h1>
          </div>

          <div className="mb-4 text-center lg:text-left">
            <h2 className="text-2xl font-black text-[#002f6c] mb-1">Create an Account</h2>
            <p className="text-gray-500 text-xs font-medium">Join the BSG CBT platform today</p>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex p-1 bg-gray-100/80 rounded-lg mb-5 border border-gray-200">
            <button
              type="button"
              onClick={() => setRole('Candidate')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'Candidate' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={14} /> Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('Examiner')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'Examiner' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={14} /> Examiner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Surname and First Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400"><User size={14} /></div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                    placeholder="e.g. Sharma Anandkumar"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400"><Mail size={14} /></div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
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
                  className="space-y-3.5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">BSG ID</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><Hash size={14} /></div>
                        <input
                          type="text"
                          name="bsgId"
                          value={formData.bsgId}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                          placeholder="Exactly 10 digits"
                          maxLength={10}
                          minLength={10}
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Section</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><Shield size={14} /></div>
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm appearance-none"
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
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><MapPin size={14} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm appearance-none pointer-events-none"
                        >
                          <option value="Vadodara">Vadodara</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Unit Number</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><Hash size={14} /></div>
                        <input
                          type="text"
                          name="unitNumber"
                          value={formData.unitNumber}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                          placeholder="e.g. 033"
                          maxLength={3}
                          minLength={3}
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Unit/Group Name</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-gray-400"><Building size={14} /></div>
                      <input
                        type="text"
                        name="unitName"
                        value={formData.unitName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
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
                  className="space-y-3.5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Designation</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><Briefcase size={14} /></div>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                          placeholder="e.g. Scout Master"
                          required={role === 'Examiner'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-gray-400"><MapPin size={14} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm appearance-none pointer-events-none"
                        >
                          <option value="Vadodara">Vadodara</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Examiner Access Code</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-gray-400"><Key size={14} /></div>
                      <input
                        type="password"
                        name="examinerCode"
                        value={formData.examinerCode}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                        placeholder="Provided by Admin"
                        required={role === 'Examiner'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gray-400"><Lock size={14} /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-[#002f6c] transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#002f6c] hover:bg-[#001f4d] text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg mt-4 flex items-center justify-center gap-2 text-sm"
            >
              Register as {role}
            </button>

            <p className="text-center text-xs text-gray-600 font-medium mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-[#002f6c] font-black hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </motion.div>
      </div>

      <style jsx global>{`
        /* Minimalist Scrollbar just in case it scrolls on very small desktop screens */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}