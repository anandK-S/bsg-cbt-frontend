'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // We no longer need local isMobileMenuOpen state because UnifiedLayout handles it


  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
    } catch (e) {
      console.error('Logout failed on backend', e);
    }
    logout();
    window.location.href = '/';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    setUpdateMessage('');
    try {
      const { data } = await axios.put('http://localhost:5000/api/auth/me/profile', {
        name: profileName,
        profileImage
      }, { withCredentials: true });
      useAuthStore.getState().login(data); // update zustand state
      setUpdateMessage('Profile updated successfully!');
      setTimeout(() => setShowProfileModal(false), 1500);
    } catch (err) {
      setUpdateMessage('Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isTakeExamPage = pathname?.includes('/take');

  if (isTakeExamPage) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bsg-blue to-bsg-blue-light flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <span className="text-white font-extrabold text-xs">BSG</span>
              </div>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-bsg-blue to-bsg-gold tracking-tight">
                CBT Portal
              </span>
            </Link>
          </div>

          {/* Desktop Nav - Reduced to only Login if unauthenticated */}
          <div className="hidden md:flex items-center space-x-2">
            {!isAuthenticated && !isAuthPage && _hasHydrated && (
              <Link href="/login" className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg">
                Login
              </Link>
            )}
            {/* If authenticated, Sidebar has the main nav, so we don't need it here unless we want profile on top */}
          </div>

          {/* Mobile Menu Button - Shown only for authenticated users OR on mobile for everyone? Wait, if they are authenticated, they can use the Sidebar. If unauthenticated, maybe they need the Login button? We will just show Login button on mobile if unauthenticated. */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={onMenuClick}
                className="p-2 text-foreground"
              >
                <Menu size={24} />
              </button>
            ) : (
              !isAuthPage && _hasHydrated && (
                <Link href="/login" className="text-primary font-bold text-sm">
                  Login
                </Link>
              )
            )}
          </div>
        </div>
      </div>



      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">Edit Profile</h3>
            
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative group cursor-pointer">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-bsg-blue/20" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-transparent">
                    <UserIcon size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Change</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <p className="text-xs text-gray-500">Click image to upload new picture</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue outline-none transition-all font-medium"
              />
            </div>

            {updateMessage && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-bold text-center ${updateMessage.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {updateMessage}
              </div>
            )}

            <button
              onClick={handleProfileUpdate}
              disabled={isUpdating}
              className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70"
            >
              {isUpdating ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

    </nav>
  );
}
