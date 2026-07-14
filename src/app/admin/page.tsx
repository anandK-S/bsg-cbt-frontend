'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import '@/utils/apiConfig';

interface User {
  _id: string;
  name: string;
  email: string;
  bsgId: string;
  role: string;
  status: string;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
  questions?: unknown[];
}

export default function AdminDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'exams'>('users');
  const [loading, setLoading] = useState(true);

  // Password Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    
    if (!isAuthenticated || user?.role !== 'Admin') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, examsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users', { withCredentials: true }),
          axios.get('http://localhost:5000/api/exams', { withCredentials: true })
        ]);
        setUsers(usersRes.data);
        setExams(examsRes.data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
          router.push('/login');
        } else {
          console.error('Error fetching admin data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  const toggleBlockStatus = async (userId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'Active' ? 'block' : 'unblock';
      await axios.put(`http://localhost:5000/api/users/${userId}/${action}`, {}, {
        withCredentials: true,
      });
      setUsers(users.map((u: User) => u._id === userId ? { ...u, status: currentStatus === 'Active' ? 'Blocked' : 'Active' } : u));
    } catch (error) {
      console.error(`Error ${currentStatus === 'Active' ? 'blocking' : 'unblocking'} user:`, error);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setIsResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      if (!selectedUser) return;
      await axios.put(`http://localhost:5000/api/users/${selectedUser._id}/password`, {
        newPassword
      }, {
        withCredentials: true,
      });
      setResetSuccess('Password reset successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        setResetSuccess('');
      }, 2000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setResetError(error.response?.data?.message || 'Failed to reset password');
      } else {
        setResetError('Failed to reset password');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const openPasswordModal = (u: User) => {
    setSelectedUser(u);
    setNewPassword('');
    setResetError('');
    setResetSuccess('');
    setShowPasswordModal(true);
  };

  if (loading || !_hasHydrated) return <div className="min-h-[60vh] flex items-center justify-center text-primary font-semibold">Loading Admin Dashboard...</div>;
  if (!isAuthenticated || user?.role !== 'Admin') return null;

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const blockedUsers = users.filter(u => u.status === 'Blocked').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-bsg-blue to-bsg-blue-dark rounded-3xl p-8 mb-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-blue-100 text-lg font-medium">Manage your system users, examiners, and monitor overall platform health.</p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-blue-50 text-bsg-blue mr-5 text-3xl shadow-inner">👥</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Users</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{totalUsers}</dd>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-green-50 text-green-600 mr-5 text-3xl shadow-inner">✅</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Users</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{activeUsers}</dd>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-red-50 text-red-600 mr-5 text-3xl shadow-inner">🚫</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Blocked Users</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{blockedUsers}</dd>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 mb-8 inline-flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-bsg-blue text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'exams' ? 'bg-bsg-blue text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
        >
          Exam Management
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-gray-100 mb-10">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-black text-gray-900">User Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Name / BSG ID</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map((u: User) => (
                  <tr key={u._id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900 group-hover:text-bsg-blue transition-colors">{u.name}</div>
                      <div className="text-sm font-medium text-gray-500">{u.bsgId} | {u.email}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 w-max ${u.role === 'Admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' : u.role === 'Examiner' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}>
                        {u.role === 'Admin' && '👑 '}
                        {u.role === 'Examiner' && '📝 '}
                        {u.role === 'Candidate' && '🎓 '}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-full w-max ${u.status === 'Active' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        {u.role !== 'Admin' && (
                          <>
                            <button
                              onClick={() => openPasswordModal(u)}
                              className="text-bsg-blue hover:text-white font-black hover:bg-bsg-blue px-4 py-2 rounded-xl transition-all shadow-sm border border-blue-100"
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => toggleBlockStatus(u._id, u.status)}
                              className={`px-4 py-2 rounded-xl font-black transition-all shadow-sm border ${u.status === 'Active' ? 'border-red-200 text-red-600 hover:bg-red-600 hover:text-white' : 'border-green-200 text-green-600 hover:bg-green-600 hover:text-white'}`}
                            >
                              {u.status === 'Active' ? 'Block' : 'Unblock'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-gray-100 mb-10">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">All Exams</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Exam Title</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {exams.map((exam: Exam) => (
                  <tr key={exam._id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-gray-900 group-hover:text-bsg-blue transition-colors">{exam.title}</div>
                      <div className="text-sm font-medium text-gray-500 truncate max-w-xs">{exam.description || 'No description'}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-600 flex items-center gap-1.5">
                      ⏱️ {exam.durationMinutes} mins
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-full w-max flex items-center gap-1.5 ${exam.status === 'Published' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${exam.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/examiner/exams/${exam._id}`)}
                        className="text-bsg-blue hover:text-white font-black hover:bg-bsg-blue px-6 py-2 rounded-xl transition-all shadow-sm border border-blue-100 inline-block"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium">
                      <div className="text-4xl mb-4">🗂️</div>
                      No exams found in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isResetting && setShowPasswordModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                      Reset Password for {selectedUser?.name}
                    </h3>
                    <div className="mt-4">
                      {resetError && <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">{resetError}</div>}
                      {resetSuccess && <div className="mb-4 p-2 bg-green-50 text-green-700 text-sm rounded border border-green-200">{resetSuccess}</div>}
                      
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="new-password"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-bsg-blue focus:border-bsg-blue sm:text-sm"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 6 chars)"
                          disabled={isResetting || !!resetSuccess}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResetting || !!resetSuccess}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-bsg-blue text-base font-bold text-white hover:bg-bsg-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isResetting || !!resetSuccess}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bsg-blue sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
