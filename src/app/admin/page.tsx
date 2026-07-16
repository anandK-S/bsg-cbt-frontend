'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
  Users, ShieldCheck, UserX, UserCheck, Search, Filter, 
  MoreVertical, Edit, Trash2, Mail, ShieldAlert,
  ChevronRight, Database, Download, Plus, LayoutGrid, List
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

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
          axios.get(`${API_URL}/api/users`, { withCredentials: true }),
          axios.get(`${API_URL}/api/exams`, { withCredentials: true })
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
      await axios.put(`${API_URL}/api/users/${userId}/${action}`, {}, {
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
      await axios.put(`${API_URL}/api/users/${selectedUser._id}/password`, {
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
      await axios.post(`${API_URL}/api/auth/create-examiner`, {
        name: examinerName,
        email: examinerEmail,
        password: examinerPassword
      }, {
        withCredentials: true,
      });
      setExaminerSuccess('Examiner created successfully!');
      
      const usersRes = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
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
      await axios.delete(`${API_URL}/api/users/${userToDelete._id}`, {
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
      const { data } = await axios.get(`${API_URL}/api/users/examiner/${examiner._id}/insights`, {
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
      const { data } = await axios.post(`${API_URL}/api/users/bulk-import`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkImportResult(data);
      const usersRes = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
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
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.bsgId && u.bsgId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRole && matchSection && matchSearch;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/30">
      
      {/* Sleek Header Component */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] text-white p-8 md:p-12 mb-8 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-gray-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-72 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck size={14} /> Control Panel
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Admin Workspace
          </h1>
          <p className="text-gray-400 text-lg font-medium max-w-xl">
            Monitor system health, manage examiners and candidates, and configure global portal settings.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => router.push('/admin/settings')}
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <ShieldAlert size={18} /> Global Settings
          </button>
          <button 
            onClick={() => setShowExaminerModal(true)}
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Examiner
          </button>
        </div>
      </div>
      
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-100' },
          { label: 'Active Candidates', value: activeUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-100' },
          { label: 'Blocked Accounts', value: blockedUsers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-100' },
          { label: 'Examiners', value: totalExaminers, icon: Database, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-100' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bg.replace('/10', '/5')} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} ${stat.border} border`}>
                <stat.icon size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Users size={18} /> User Management
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <List size={18} /> Platform Exams
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name, email, or BSG ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow text-sm font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-1">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm focus:outline-none py-2 font-bold cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="Candidate">Candidates</option>
                  <option value="Examiner">Examiners</option>
                  <option value="Admin">Admins</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-1">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm focus:outline-none py-2 font-bold cursor-pointer"
                >
                  <option value="All">All Sections</option>
                  <option value="Scout">Scout</option>
                  <option value="Guide">Guide</option>
                  <option value="Rover">Rover</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ml-auto lg:ml-0"
              >
                <Download size={16} /> Bulk Import
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">User Identity</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Role & Status</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Section</th>
                  <th scope="col" className="px-8 py-5 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Management Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((u: User) => (
                  <tr key={u._id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${
                          u.role === 'Admin' ? 'bg-purple-500' : u.role === 'Examiner' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</div>
                          <div className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                            <Mail size={10} /> {u.email} {u.bsgId && <span className="text-gray-300">|</span>} {u.bsgId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                          u.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                          u.role === 'Examiner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {u.role}
                        </span>
                        <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                          u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-700">{u.section || '-'}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-100 lg:opacity-50 group-hover:opacity-100 transition-opacity">
                        {u.role !== 'Admin' && (
                          <>
                            <button
                              onClick={() => openPasswordModal(u)}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all border border-transparent hover:border-blue-100"
                              title="Reset Password"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => toggleBlockStatus(u._id, u.status)}
                              className={`p-2 rounded-xl transition-all border border-transparent ${
                                u.status === 'Active' ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-100' : 'text-orange-500 hover:text-green-600 hover:bg-green-50 hover:border-green-100'
                              }`}
                              title={u.status === 'Active' ? 'Block User' : 'Unblock User'}
                            >
                              <ShieldCheck size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="text-gray-500 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all border border-transparent hover:border-rose-100"
                              title="Delete Permanently"
                            >
                              <Trash2 size={18} />
                            </button>
                            {u.role === 'Examiner' && (
                              <button
                                onClick={() => fetchExaminerInsights(u)}
                                className="text-gray-500 hover:text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-xl font-bold transition-all border border-transparent hover:border-purple-100"
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
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-gray-500">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Search className="text-gray-400" size={24} />
                      </div>
                      <p className="text-lg font-bold text-gray-700">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/30">
            <h3 className="text-lg font-black text-gray-900">Platform Exams Overview</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Monitor all exams created by examiners.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Exam Title</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Created By</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status & Duration</th>
                  <th scope="col" className="px-8 py-5 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {exams.map((exam: Exam) => (
                  <tr key={exam._id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</div>
                      <div className="text-xs font-medium text-gray-500 truncate max-w-xs mt-1">{exam.description || 'No description provided'}</div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
                          {/* @ts-ignore */}
                          {exam.creatorId?.name?.charAt(0) || '?'}
                        </div>
                        {/* @ts-ignore */}
                        {exam.creatorId?.name || 'Unknown Examiner'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                          exam.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {exam.status}
                        </span>
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          ⏱️ {exam.durationMinutes} minutes
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => router.push(`/examiner/exams/${exam._id}`)}
                        className="text-gray-500 group-hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold transition-all border border-transparent hover:border-blue-100 inline-flex items-center gap-2"
                      >
                        Inspect <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-gray-500">
                      <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <List className="text-gray-400" size={24} />
                      </div>
                      <p className="text-lg font-bold text-gray-700">No exams yet</p>
                      <p className="text-sm mt-1">Examiners have not created any exams.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals remain functionally the same but visually upgraded */}
      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative transform transition-all">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">For user: {selectedUser?.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {resetError && <p className="mt-4 text-rose-500 font-semibold text-sm bg-rose-50 p-3 rounded-xl">{resetError}</p>}
            {resetSuccess && <p className="mt-4 text-emerald-500 font-semibold text-sm bg-emerald-50 p-3 rounded-xl">{resetSuccess}</p>}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button 
                onClick={handlePasswordReset} 
                className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-2"
                disabled={isResetting}
              >
                {isResetting ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Examiner Modal */}
      {showExaminerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Create New Examiner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={examinerName} 
                  onChange={e => setExaminerName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={examinerEmail} 
                  onChange={e => setExaminerEmail(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="examiner@bsg.org"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Password</label>
                <div className="relative">
                  <input 
                    type={showExaminerPassword ? "text" : "password"}
                    value={examinerPassword} 
                    onChange={e => setExaminerPassword(e.target.value)} 
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 text-sm font-bold"
                    onClick={() => setShowExaminerPassword(!showExaminerPassword)}
                  >
                    {showExaminerPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            {examinerError && <p className="mt-4 text-rose-500 font-semibold text-sm bg-rose-50 p-3 rounded-xl">{examinerError}</p>}
            {examinerSuccess && <p className="mt-4 text-emerald-500 font-semibold text-sm bg-emerald-50 p-3 rounded-xl">{examinerSuccess}</p>}
            
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
                className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-2"
                disabled={isCreatingExaminer}
              >
                {isCreatingExaminer ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-t-8 border-rose-500">
            <h2 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2">
              <ShieldAlert /> Critical Action
            </h2>
            
            <p className="text-gray-600 font-medium mb-6">
              You are about to permanently delete <strong className="text-gray-900">{userToDelete?.name}</strong>. This action is irreversible. Enter your Admin password to proceed.
            </p>
            
            <div className="space-y-4">
              <div>
                <input 
                  type="password" 
                  value={adminPasswordForDelete} 
                  onChange={e => setAdminPasswordForDelete(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all bg-rose-50/50"
                  placeholder="Admin Password"
                />
              </div>
            </div>

            {deleteError && <p className="mt-4 text-rose-500 font-semibold text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">{deleteError}</p>}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handlePermanentDelete} 
                className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Bulk Import Users</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📄</div>
              <p className="text-gray-700 font-bold mb-1">
                {bulkImportFile ? bulkImportFile.name : 'Click or drag CSV file here'}
              </p>
              <p className="text-xs text-gray-500 font-medium">Must include headers: name, email, password, section, bsgId</p>
            </div>

            {bulkImportResult && (
              <div className={`mt-4 p-4 rounded-xl text-sm font-medium border ${
                bulkImportResult.errors?.length ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <p className="font-bold">{bulkImportResult.message}</p>
                {bulkImportResult.createdCount !== undefined && (
                  <p>Successfully created: {bulkImportResult.createdCount}</p>
                )}
                {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
                    {bulkImportResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowBulkImportModal(false);
                  setBulkImportFile(null);
                  setBulkImportResult(null);
                }} 
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isBulkImporting}
              >
                {bulkImportResult ? 'Close' : 'Cancel'}
              </button>
              <button 
                onClick={handleBulkImport} 
                disabled={!bulkImportFile || isBulkImporting}
                className="px-6 py-2.5 rounded-xl font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
