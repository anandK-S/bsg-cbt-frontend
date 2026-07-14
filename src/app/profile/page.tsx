'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
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
      const { data } = await axios.put('http://localhost:5000/api/auth/me/profile', {
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href={user.role === 'Candidate' ? '/dashboard' : '/examiner'} className="text-gray-500 hover:text-gray-900 font-medium">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="Your Name"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-extrabold py-4 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
