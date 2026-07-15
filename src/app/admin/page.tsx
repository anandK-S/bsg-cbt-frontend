'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface User {
  _id: string;
  name: string;
  email: string;
  bsgId: string;
  section?: string;
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

  // Create Examiner Modal State
  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [examinerName, setExaminerName] = useState('');
  const [examinerEmail, setExaminerEmail] = useState('');
  const [examinerPassword, setExaminerPassword] = useState('');
  const [isCreatingExaminer, setIsCreatingExaminer] = useState(false);
  const [examinerError, setExaminerError] = useState('');
  const [examinerSuccess, setExaminerSuccess] = useState('');
  const [showExaminerPassword, setShowExaminerPassword] = useState(false);

  // Permanent Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [adminPasswordForDelete, setAdminPasswordForDelete] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Filtering State
  const [roleFilter, setRoleFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Insights State
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedExaminer, setSelectedExaminer] = useState<User | null>(null);
  const [insightsData, setInsightsData] = useState<{ exams: any[], attempts: any[] } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Bulk Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState<{ message: string, createdCount?: number, errors?: string[] } | null>(null);

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

  const handleCreateExaminer = async () => {
    if (!examinerName || !examinerEmail || !examinerPassword) {
      setExaminerError('All fields are required');
      return;
    }
    if (examinerPassword.length < 6) {
      setExaminerError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingExaminer(true);
    setExaminerError('');
    setExaminerSuccess('');

    try {
      await axios.post('http://localhost:5000/api/auth/create-examiner', {
        name: examinerName,
        email: examinerEmail,
        password: examinerPassword
      }, {
        withCredentials: true,
      });
      setExaminerSuccess('Examiner created successfully!');
      
      // Refresh user list
      const usersRes = await axios.get('http://localhost:5000/api/users', { withCredentials: true });
      setUsers(usersRes.data);

      setTimeout(() => {
        setShowExaminerModal(false);
        setExaminerName('');
        setExaminerEmail('');
        setExaminerPassword('');
        setExaminerSuccess('');
      }, 2000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setExaminerError(error.response?.data?.message || 'Failed to create examiner');
      } else {
        setExaminerError('Failed to create examiner');
      }
    } finally {
      setIsCreatingExaminer(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!adminPasswordForDelete) {
      setDeleteError('Admin password is required');
      return;
    }
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`, {
        data: { adminPassword: adminPasswordForDelete },
        withCredentials: true,
      });
      
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      setAdminPasswordForDelete('');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setDeleteError(error.response?.data?.message || 'Failed to delete user');
      } else {
        setDeleteError('Failed to delete user');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (u: User) => {
    setUserToDelete(u);
    setAdminPasswordForDelete('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const fetchExaminerInsights = async (examiner: User) => {
    setSelectedExaminer(examiner);
    setShowInsightsModal(true);
    setLoadingInsights(true);
    setInsightsData(null);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/users/examiner/${examiner._id}/insights`, {
        withCredentials: true,
      });
      setInsightsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) return;
    setIsBulkImporting(true);
    setBulkImportResult(null);

    const formData = new FormData();
    formData.append('file', bulkImportFile);

    try {
      const { data } = await axios.post('http://localhost:5000/api/users/bulk-import', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkImportResult(data);
      // Refresh user list
      const usersRes = await axios.get('http://localhost:5000/api/users', { withCredentials: true });
      setUsers(usersRes.data);
    } catch (error: any) {
      setBulkImportResult({ message: error.response?.data?.message || 'Failed to import users' });
    } finally {
      setIsBulkImporting(false);
    }
  };

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Admin Dashboard..." />;
  if (!isAuthenticated || user?.role !== 'Admin') return null;

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const blockedUsers = users.filter(u => u.status === 'Blocked').length;
  const totalExaminers = users.filter(u => u.role === 'Examiner').length;

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchSection = sectionFilter === 'All' || u.section === sectionFilter;
    return matchRole && matchSection;
  });

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-purple-50 text-purple-600 mr-5 text-3xl shadow-inner">📝</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Examiners</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{totalExaminers}</dd>
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
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-black text-gray-900">User Directory</h3>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm"
              >
                <option value="All">All Roles</option>
                <option value="Candidate">Candidate</option>
                <option value="Examiner">Examiner</option>
                <option value="Admin">Admin</option>
              </select>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm"
              >
                <option value="All">All Sections</option>
                <option value="Scout">Scout</option>
                <option value="Guide">Guide</option>
                <option value="Rover">Rover</option>
                <option value="Ranger">Ranger</option>
                <option value="Leader">Leader</option>
              </select>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark px-4 py-2.5 rounded-xl font-black text-sm shadow-md transition-all whitespace-nowrap"
              >
                📥 Bulk Import
              </button>
              <button
                onClick={() => setShowExaminerModal(true)}
                className="bg-bsg-blue hover:bg-bsg-blue-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all whitespace-nowrap ml-auto md:ml-0"
              >
                + Add Examiner
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Name / BSG ID</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Section</th>
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredUsers.map((u: User) => (
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
                      <div className="text-sm font-medium text-gray-700">{u.section || '-'}</div>
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
                              className={`px-4 py-2 rounded-xl font-black transition-all shadow-sm border ${u.status === 'Active' ? 'border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white' : 'border-green-200 text-green-600 hover:bg-green-600 hover:text-white'}`}
                            >
                              {u.status === 'Active' ? 'Soft Delete' : 'Unblock'}
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="px-4 py-2 rounded-xl font-black transition-all shadow-sm border border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              Perm Delete
                            </button>
                            {u.role === 'Examiner' && (
                              <button
                                onClick={() => fetchExaminerInsights(u)}
                                className="px-4 py-2 rounded-xl font-black transition-all shadow-sm border border-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white"
                              >
                                Insights
                              </button>
                            )}
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
                  <th scope="col" className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Examiner</th>
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
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {/* @ts-ignore */}
                        {exam.creatorId?.name || 'Unknown'}
                      </div>
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

      {/* Create Examiner Modal */}
      {showExaminerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Create Examiner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={examinerName} 
                  onChange={e => setExaminerName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-bsg-blue focus:border-transparent outline-none transition-all"
                  placeholder="Examiner Name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={examinerEmail} 
                  onChange={e => setExaminerEmail(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-bsg-blue focus:border-transparent outline-none transition-all"
                  placeholder="examiner@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showExaminerPassword ? "text" : "password"}
                    value={examinerPassword} 
                    onChange={e => setExaminerPassword(e.target.value)} 
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-bsg-blue focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowExaminerPassword(!showExaminerPassword)}
                  >
                    {showExaminerPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {examinerError && <p className="mt-4 text-red-500 font-semibold text-sm bg-red-50 p-3 rounded-xl">{examinerError}</p>}
            {examinerSuccess && <p className="mt-4 text-green-500 font-semibold text-sm bg-green-50 p-3 rounded-xl">{examinerSuccess}</p>}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowExaminerModal(false);
                  setExaminerError('');
                  setExaminerSuccess('');
                }} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isCreatingExaminer}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateExaminer} 
                className="px-6 py-2.5 rounded-xl font-bold bg-bsg-blue hover:bg-bsg-blue-dark text-white shadow-md transition-all flex items-center gap-2"
                disabled={isCreatingExaminer}
              >
                {isCreatingExaminer ? 'Creating...' : 'Create Examiner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-t-8 border-red-500">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="text-3xl">⚠️</div>
              <h2 className="text-2xl font-black">Permanent Delete</h2>
            </div>
            
            <p className="text-gray-600 font-medium mb-6">
              You are about to permanently delete <strong className="text-gray-900">{userToDelete?.name}</strong>. This action cannot be undone. Please enter your Admin password to confirm.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Your Admin Password</label>
                <input 
                  type="password" 
                  value={adminPasswordForDelete} 
                  onChange={e => setAdminPasswordForDelete(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="Verify your password"
                />
              </div>
            </div>

            {deleteError && <p className="mt-4 text-red-500 font-semibold text-sm bg-red-50 p-3 rounded-xl border border-red-100">{deleteError}</p>}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                  setAdminPasswordForDelete('');
                }} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handlePermanentDelete} 
                className="px-6 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Examiner Insights Modal */}
      {showInsightsModal && selectedExaminer && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInsightsModal(false)}></div>
            <div className="relative inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-4xl w-full">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white" id="modal-title">
                  Examiner Insights: {selectedExaminer.name}
                </h3>
                <button onClick={() => setShowInsightsModal(false)} className="text-white hover:text-gray-200 text-2xl font-bold">&times;</button>
              </div>
              <div className="px-8 py-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
                {loadingInsights ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : insightsData ? (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">📝 Prepared Exams</h4>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Title</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {insightsData.exams.map((exam: any) => (
                              <tr key={exam._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{exam.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.questions?.length || 0} questions</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exam.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {exam.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {insightsData.exams.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No exams created by this examiner.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">🎓 Candidate Results (For their exams)</h4>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Title</th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {insightsData.attempts.map((attempt: any) => {
                              const associatedExam = insightsData.exams.find(e => e._id === attempt.examId);
                              let earned = 0;
                              let total = 0;
                              if (associatedExam) {
                                attempt.answers.forEach((ans: any) => {
                                  const examQ = associatedExam.questions.find((q: any) => q.questionId._id === ans.questionId);
                                  if (examQ) {
                                    total += examQ.marks;
                                    const actualQ = examQ.questionId;
                                    if (ans.selectedOptionIndex === actualQ.correctOptionIndex) {
                                      earned += examQ.marks;
                                    }
                                  }
                                });
                              }
                              return (
                                <tr key={attempt._id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {attempt.candidateId?.name || 'Unknown'}
                                    <div className="text-xs text-gray-500 font-normal">{attempt.candidateId?.section}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{associatedExam?.title || 'Unknown Exam'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                    <span className={earned === total && total > 0 ? 'text-green-600' : 'text-blue-600'}>
                                      {earned} / {total || '-'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {insightsData.attempts.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No attempts recorded for these exams yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">Failed to load insights.</div>
                )}
              </div>
              <div className="bg-white px-4 py-3 border-t border-gray-100 sm:px-6 flex flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowInsightsModal(false)}
                  className="w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Bulk Import Users</h2>
            <p className="text-gray-500 text-sm mb-6">Upload a CSV file with columns: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-bold">name, email, password, role, bsgId, section, state</code></p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Select CSV File</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setBulkImportFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-bsg-blue/10 file:text-bsg-blue hover:file:bg-bsg-blue/20"
              />
            </div>
            
            {bulkImportResult && (
              <div className={`mb-6 p-4 rounded-xl border ${bulkImportResult.errors?.length ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <p className={`font-bold ${bulkImportResult.errors?.length ? 'text-orange-800' : 'text-green-800'}`}>
                  {bulkImportResult.message}
                </p>
                {bulkImportResult.createdCount !== undefined && (
                  <p className="text-sm font-medium mt-1 text-gray-700">Users created: {bulkImportResult.createdCount}</p>
                )}
                {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600 bg-white p-2 rounded border border-red-100">
                    {bulkImportResult.errors.map((e, idx) => <div key={idx}>{e}</div>)}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkImportFile(null);
                  setBulkImportResult(null);
                }} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isBulkImporting}
              >
                Close
              </button>
              <button 
                onClick={handleBulkImport} 
                className="px-6 py-2.5 rounded-xl font-bold bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                disabled={isBulkImporting || !bulkImportFile}
              >
                {isBulkImporting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
