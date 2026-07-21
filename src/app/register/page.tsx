'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Shield, MapPin, Users, Building, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bsgId: '',
    section: 'Scout',
    district: 'Vadodara',
    unitNumber: '',
    unitName: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your registration logic here
    console.log(formData);
  };

  return (
    // The pt-24 here is the magic class that pushes the content below your fixed header!
    <div className="min-h-screen flex bg-gray-50 pt-20 md:pt-24 lg:pt-0">
      
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#002f6c] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 text-center max-w-md">
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
            Create your account to unlock access to exclusive computer-based tests, resources, and performance insights.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Mobile Header Spacer - ensures content isn't hidden under mobile nav */}
        <div className="absolute top-0 w-full h-20 bg-gray-50 lg:hidden"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 w-full max-w-2xl p-6 sm:p-10 relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Create an Account</h2>
            <p className="text-gray-500 font-medium">Join the BSG CBT platform today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Surname and First Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><User size={18} /></div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                  placeholder="e.g. Sharma Anandkumar"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><Mail size={18} /></div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* BSG ID & Section */}
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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                    placeholder="Exactly 8 digits"
                    maxLength={8}
                    required
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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900 appearance-none"
                  >
                    <option value="Scout">Scout</option>
                    <option value="Guide">Guide</option>
                    <option value="Rover">Rover</option>
                    <option value="Ranger">Ranger</option>
                  </select>
                </div>
              </div>
            </div>

            {/* District & Unit Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">District</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400"><MapPin size={18} /></div>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900 appearance-none"
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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                    placeholder="e.g. 33"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Unit Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Unit/Group Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><Building size={18} /></div>
                <input
                  type="text"
                  name="unitName"
                  value={formData.unitName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                  placeholder="e.g. NAIR, B.P Group"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-400"><Lock size={18} /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#002f6c] focus:border-transparent transition-all outline-none font-medium text-gray-900"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Must include a letter, number, and special character.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#002f6c] hover:bg-[#001f4d] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-4"
            >
              Register Account
            </button>

            <p className="text-center text-sm text-gray-500 font-medium mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#002f6c] font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}