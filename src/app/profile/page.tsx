'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { useRouter } from 'next/navigation';
import { UserCircle, Link as LinkIcon, Camera, Upload, X, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, setUser, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bsgId, setBsgId] = useState('');
  const [section, setSection] = useState('');
  const [district, setDistrict] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPopup, setShowPopup] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[a-zA-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500 text-red-700' };
    if (score === 3) return { score, label: 'Good', color: 'bg-yellow-500 text-yellow-700' };
    return { score, label: 'Strong', color: 'bg-green-500 text-green-700' };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setName(user.name || '');
      setProfileImage(user.profileImage || '');
      setBsgId(user.bsgId || '');
      setSection(user.section || '');
      setDistrict(user.district || '');
      setUnitName(user.unitName || '');
      setUnitNumber(user.unitNumber || '');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.put(`${API_URL}/api/auth/me/profile`, {
        name,
        profileImage,
        password: password || undefined,
        bsgId,
        section,
        district,
        unitName,
        unitNumber
      }, {
        withCredentials: true
      });

      setUser({ ...user, ...data });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setShowPopup(true);
      setPassword('');
      setTimeout(() => setShowPopup(false), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
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
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Profile Settings</h1>
              <p className="text-blue-100 font-medium">Manage your personal information and preferences.</p>
            </div>
            <Link href={user.role === 'Candidate' ? '/dashboard' : '/examiner'} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-sm border border-white/20 transition-all text-center">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-100 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            
            {/* Avatar Preview */}
            <div className="flex flex-col items-center space-y-4 w-full sm:w-1/3">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; }} />
                ) : (
                  <UserCircle size={64} className="text-gray-300" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full"
                >
                  <Camera size={28} className="text-white" />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-500 text-center uppercase tracking-wider">{user.role}</p>
              {profileImage && (
                <button type="button" onClick={() => setProfileImage('')} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                  <X size={12} /> Remove Photo
                </button>
              )}
            </div>

            {/* Popup Notification */}
            {showPopup && message.text && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-200 relative">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6">
                    {message.type === 'success' ? (
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    ) : (
                      <XCircle className="h-16 w-16 text-red-500" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {message.type === 'success' ? 'Success!' : 'Error'}
                  </h3>
                  <p className="text-gray-600 mb-6 font-medium">
                    {message.text}
                  </p>
                  <button
                    onClick={() => setShowPopup(false)}
                    className={`w-full font-bold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95 text-white ${message.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    Okay
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdate} className="flex-1 space-y-6 w-full">

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Name (First Name + Surname)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  pattern="[a-zA-Z\s]+"
                  title="Name can only contain letters and spaces."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="E.g. Anandkumar Sharma"
                />
              </div>

              {/* Removed Extra Fields per Request */}

              {/* Profile Image — URL or Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Camera size={16} className="text-gray-400" /> Profile Image
                </label>

                {/* Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${imageMode === 'url' ? 'bg-bsg-blue text-white border-bsg-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-bsg-blue'}`}
                  >
                    <LinkIcon size={12} /> Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageMode('upload'); fileInputRef.current?.click(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${imageMode === 'upload' ? 'bg-bsg-blue text-white border-bsg-blue' : 'bg-white text-gray-600 border-gray-200 hover:border-bsg-blue'}`}
                  >
                    <Upload size={12} /> Upload File
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <>
                    <input
                      type="url"
                      value={profileImage.startsWith('data:') ? '' : profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                      placeholder="https://example.com/my-photo.jpg"
                    />
                    <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                      <LinkIcon size={12} /> Paste a direct link to an image (e.g., from Imgur, LinkedIn).
                    </p>
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-bsg-blue hover:bg-blue-50/40 transition-all"
                  >
                    <Upload size={24} className="text-gray-400" />
                    <p className="text-sm text-gray-500 font-medium">Click to upload an image</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP — Max 2 MB</p>
                    {profileImage.startsWith('data:') && <p className="text-xs text-green-600 font-bold">✓ Image uploaded</p>}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Password */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-bold text-gray-700">Change Password <span className="font-normal text-gray-400">(Optional)</span></label>
                  {password && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${strength.color.split(' ')[0]} text-white`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue transition-all"
                  placeholder="New password (leave blank to keep current)"
                />
                {password && (
                  <div className="flex gap-1 mt-2">
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 1 ? strength.color.split(' ')[0] : 'bg-gray-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 2 ? strength.color.split(' ')[0] : 'bg-gray-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 3 ? strength.color.split(' ')[0] : 'bg-gray-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 4 ? strength.color.split(' ')[0] : 'bg-gray-200'}`}></div>
                  </div>
                )}
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
