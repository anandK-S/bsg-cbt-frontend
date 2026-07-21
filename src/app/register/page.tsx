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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, ...formData });
    // Add your registration logic here
  };

  return (
    // Reverted to bg-white to match your exact theme, keeping the padding for the fixed header
    <div className="min-h-screen flex bg-white pt-20 md:pt-24 lg:pt-0">
      
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Hexagon-style geometric pattern to match your original image */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(30deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(150deg, #ffffff 12%, transparent 12.5%, transparent 87%, #ffffff 87.5%, #ffffff), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77), linear-gradient(60deg, #ffffff77 25%, transparent 25.5%, transparent 75%, #ffffff77 75%, #ffffff77)', backgroundSize: '40px 70px', backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px' }}></div>
        
        <div className="relative z-10 text-center max-w-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10"
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
            Create your account to unlock access to exclusive computer-based tests and resources.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-4 sm:p-8 relative bg-white">
        {/* Mobile Header Spacer */}
        <div className="absolute top-0 w-full h-20 bg-white lg:hidden"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[32rem] p-2 relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#002f6c] mb-2">Create an Account</h2>
            <p className="text-gray-500 font-medium">Join the BSG CBT platform today</p>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-8 border border-gray-200">
            <button
              type="button"
              onClick={() => setRole('Candidate')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Candidate' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={16} /> Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('Examiner')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${role === 'Examiner' ? 'bg-white shadow-sm text-[#002f6c] border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={16} /> Examiner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><User size={18} /></div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                  placeholder="e.g. Sharma Anandkumar"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><Mail size={18} /></div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Conditional Fields using AnimatePresence for smooth transitions */}
            <AnimatePresence mode="wait">
              {role === 'Candidate' ? (
                <motion.div
                  key="candidate-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">BSG ID</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><Hash size={18} /></div>
                        <input
                          type="text"
                          name="bsgId"
                          value={formData.bsgId}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                          placeholder="Exactly 8 digits"
                          maxLength={8}
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Section</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><Shield size={18} /></div>
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 appearance-none"
                        >
                          <option value="Scout">Scout</option>
                          <option value="Guide">Guide</option>
                          <option value="Rover">Rover</option>
                          <option value="Ranger">Ranger</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><MapPin size={18} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 appearance-none"
                        >
                          <option value="Vadodara">Vadodara</option>
                          <option value="Ahmedabad">Ahmedabad</option>
                          <option value="Surat">Surat</option>
                          <option value="Rajkot">Rajkot</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Unit/Group Number</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><Hash size={18} /></div>
                        <input
                          type="text"
                          name="unitNumber"
                          value={formData.unitNumber}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                          placeholder="e.g. 33"
                          required={role === 'Candidate'}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Unit/Group Name</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400"><Building size={18} /></div>
                      <input
                        type="text"
                        name="unitName"
                        value={formData.unitName}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
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
                  className="space-y-5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Designation</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><Briefcase size={18} /></div>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                          placeholder="e.g. District Examiner"
                          required={role === 'Examiner'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">District</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-gray-400"><MapPin size={18} /></div>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900 appearance-none"
                        >
                          <option value="Vadodara">Vadodara</option>
                          <option value="Ahmedabad">Ahmedabad</option>
                          <option value="Surat">Surat</option>
                          <option value="Rajkot">Rajkot</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Examiner Access Code</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-gray-400"><Key size={18} /></div>
                      <input
                        type="text"
                        name="examinerCode"
                        value={formData.examinerCode}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                        placeholder="Admin provided access code"
                        required={role === 'Examiner'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><Lock size={18} /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#002f6c]/20 focus:border-[#002f6c] transition-all outline-none font-medium text-gray-900"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-[#002f6c] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Must include a letter, number, and special character.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#002f6c] hover:bg-[#001f4d] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              Register as {role}
            </button>

            <p className="text-center text-sm text-gray-600 font-medium mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#002f6c] font-black hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}