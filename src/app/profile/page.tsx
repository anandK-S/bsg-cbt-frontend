'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { useRouter } from 'next/navigation';
import { UserCircle, Link as LinkIcon, Camera } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, setUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setName(user.name);
      setProfileImage(user.profileImage || '');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.put(`${API_URL}/api/auth/me/profile`, {
        name,
        profileImage,
        password: password || undefined,
      }, {
        withCredentials: true
      });

      setUser(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setPassword(''); // Clear password field
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!_hasHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          {/* Abstract background shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Profile Settings</h1>
              <p className="text-blue-100 font-medium">Manage your personal information and preferences.</p>
            </div>
            <Link href={user.role === 'Candidate' ? '/dashboard' : '/examiner'} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-sm border border-white/20 transition-all text-center">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-100 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            
            {/* Avatar Preview */}
            <div className="flex flex-col items-center space-y-4 w-full sm:w-1/3">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; }} />
                ) : (
                  <UserCircle size={64} className="text-gray-300" />
                )}
              </div>
              <p className="text-sm font-bold text-gray-500 text-center uppercase tracking-wider">{user.role}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdate} className="flex-1 space-y-6 w-full">
              
              {message.text && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Name (First Name + Surname)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  pattern="[a-zA-Z\s]+"
                  title="Name can only contain letters and spaces (no special characters or numbers)."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="E.g. Anandkumar Sharma"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Camera size={16} className="text-gray-400" /> Profile Image URL
                </label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="https://example.com/my-photo.jpg"
                />
                <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                  <LinkIcon size={12} /> Paste a direct link to an image (e.g., from Imgur, LinkedIn).
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Change Password (Optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$"
                  title="Password must be at least 6 characters and contain a letter, a number, and a special character."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="Min 6 chars, 1 letter, 1 number, 1 special char"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-extrabold py-4 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 w-full bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-extrabold py-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
