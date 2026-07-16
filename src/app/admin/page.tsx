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
  ChevronRight, Database, Download, Plus, LayoutGrid, List, UserCog, Key, Settings, TrendingUp, X
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  bsgId: string;
  section?: string;
  rank?: string;
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

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;

  // Admin Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Create Examiner Modal State
  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [examinerName, setExaminerName] = useState('');
  const [examinerEmail, setExaminerEmail] = useState('');
  const [examinerPassword, setExaminerPassword] = useState('');
  const [examinerBsgId, setExaminerBsgId] = useState('');
  const [examinerSection, setExaminerSection] = useState('');
  const [examinerRank, setExaminerRank] = useState('');
  const [isCreatingExaminer, setIsCreatingExaminer] = useState(false);
  const [examinerMsg, setExaminerMsg] = useState({ text: '', type: '' });
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

    setAdminName(user.name || '');
    setAdminEmail(user.email || '');

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

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileMsg({ text: '', type: '' });

    if (adminPassword && !passwordRegex.test(adminPassword)) {
      setProfileMsg({ text: 'Password must be 6+ chars, include a letter, number, and special character.', type: 'error' });
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const payload: any = { name: adminName, email: adminEmail };
      if (adminPassword) payload.password = adminPassword;

      await axios.put(`${API_URL}/api/auth/me/profile`, payload, { withCredentials: true });
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setAdminPassword('');
    } catch (error: any) {
      setProfileMsg({ text: error.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordRegex.test(newPassword)) {
      setResetMsg({ text: 'Password must be 6+ chars, include a letter, number, and special character.', type: 'error' });
      return;
    }

    setIsResetting(true);
    setResetMsg({ text: '', type: '' });

    try {
      if (!selectedUser) return;
      await axios.put(`${API_URL}/api/users/${selectedUser._id}/password`, {
        newPassword
      }, {
        withCredentials: true,
      });
      setResetMsg({ text: 'Password reset successfully!', type: 'success' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        setResetMsg({ text: '', type: '' });
      }, 2000);
    } catch (error: any) {
      setResetMsg({ text: error.response?.data?.message || 'Failed to reset password', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  const openPasswordModal = (u: User) => {
    setSelectedUser(u);
    setNewPassword('');
    setResetMsg({ text: '', type: '' });
    setShowPasswordModal(true);
  };

  const handleCreateExaminer = async () => {
    if (!examinerName || !examinerEmail || !examinerPassword) {
      setExaminerMsg({ text: 'Name, email, and password are required', type: 'error' });
      return;
    }
    if (!passwordRegex.test(examinerPassword)) {
      setExaminerMsg({ text: 'Password must be 6+ chars, include a letter, number, and special character.', type: 'error' });
      return;
    }

    setIsCreatingExaminer(true);
    setExaminerMsg({ text: '', type: '' });

    try {
      await axios.post(`${API_URL}/api/auth/create-examiner`, {
        name: examinerName,
        email: examinerEmail,
        password: examinerPassword,
        bsgId: examinerBsgId,
        section: examinerSection,
        rank: examinerRank
      }, {
        withCredentials: true,
      });
      setExaminerMsg({ text: 'Examiner created successfully!', type: 'success' });
      
      const usersRes = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
      setUsers(usersRes.data);

      setTimeout(() => {
        setShowExaminerModal(false);
        setExaminerName('');
        setExaminerEmail('');
        setExaminerPassword('');
        setExaminerBsgId('');
        setExaminerSection('');
        setExaminerRank('');
        setExaminerMsg({ text: '', type: '' });
      }, 2000);
    } catch (error: any) {
      setExaminerMsg({ text: error.response?.data?.message || 'Failed to create examiner', type: 'error' });
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50 text-gray-900">
      
      {/* Light Theme Header Component */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
        
        <div className="relative z-10 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-bsg-blue text-xs font-bold uppercase tracking-widest mb-3">
            <ShieldCheck size={14} /> Control Panel
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 text-gray-900 tracking-tight">
            Admin Workspace
          </h1>
          <p className="text-gray-500 text-base font-medium max-w-xl">
            Monitor system health, manage examiners and candidates, and configure global portal settings.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <UserCog size={18} /> Admin Profile
          </button>
          <button 
            onClick={() => router.push('/admin/settings')}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Settings size={18} /> Global Settings
          </button>
          <button 
            onClick={() => setShowExaminerModal(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold bg-bsg-blue hover:bg-bsg-blue-dark text-white transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} /> New Examiner
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Candidates', value: activeUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Blocked Accounts', value: blockedUsers, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Examiners', value: totalExaminers, icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'users' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <Users size={18} /> User Management
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'exams' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <List size={18} /> Platform Exams
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'users' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue focus:border-transparent outline-none transition-shadow text-sm font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1 flex-1 sm:flex-none min-w-[120px]">
                <Filter size={14} className="text-gray-400 mr-2" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm focus:outline-none py-1.5 font-bold cursor-pointer w-full"
                >
                  <option value="All">All Roles</option>
                  <option value="Candidate">Candidates</option>
                  <option value="Examiner">Examiners</option>
                  <option value="Admin">Admins</option>
                </select>
              </div>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1 flex-1 sm:flex-none min-w-[120px]">
                <Filter size={14} className="text-gray-400 mr-2" />
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="bg-transparent text-gray-700 text-sm focus:outline-none py-1.5 font-bold cursor-pointer w-full"
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
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Download size={16} /> Import
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Identity</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((u: User) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{u.email} {u.bsgId && `| ${u.bsgId}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded-md ${
                          u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'Examiner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                        <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded-md ${
                          u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{u.section || '-'}</div>
                      {u.rank && <div className="text-xs text-gray-500 mt-0.5">{u.rank}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {u.role !== 'Admin' && (
                          <>
                            <button onClick={() => openPasswordModal(u)} className="text-gray-400 hover:text-bsg-blue p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Reset Password">
                              <Key size={16} />
                            </button>
                            <button onClick={() => toggleBlockStatus(u._id, u.status)} className={`p-2 rounded-lg transition-colors ${u.status === 'Active' ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-orange-500 hover:text-emerald-500 hover:bg-emerald-50'}`} title={u.status === 'Active' ? 'Block User' : 'Unblock User'}>
                              <ShieldCheck size={16} />
                            </button>
                            <button onClick={() => openDeleteModal(u)} className="text-gray-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                            {u.role === 'Examiner' && (
                              <button onClick={() => fetchExaminerInsights(u)} className="text-gray-400 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors" title="Insights">
                                <TrendingUp size={16} />
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
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <Search className="mx-auto text-gray-400 mb-3" size={24} />
                      <p className="text-base font-bold text-gray-700">No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-900">Platform Exams Overview</h3>
            <p className="text-sm text-gray-500 font-medium">Monitor all exams created by examiners.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Details</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Creator</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {exams.map((exam: Exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{exam.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px] mt-1">{exam.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        {/* @ts-ignore */}
                        {exam.creatorId?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded-md ${
                        exam.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => router.push(`/admin/exams/${exam._id}`)}
                        className="text-bsg-blue hover:text-bsg-blue-dark font-bold text-sm inline-flex items-center gap-1"
                      >
                        Inspect <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <List className="mx-auto text-gray-400 mb-3" size={24} />
                      <p className="text-base font-bold text-gray-700">No exams yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Admin Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-bsg-blue outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-bsg-blue outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password (Optional)</label>
                <input type="password" placeholder="Leave blank to keep current" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-bsg-blue outline-none text-sm" />
                <p className="text-[10px] text-gray-500 mt-1">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
              </div>
            </div>
            {profileMsg.text && <p className={`mt-3 text-xs font-bold p-2 rounded-lg ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{profileMsg.text}</p>}
            <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full mt-5 bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
              {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
             <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-gray-500 text-xs font-medium mb-4">For user: {selectedUser?.name}</p>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-bsg-blue outline-none text-sm" placeholder="New Secure Password" />
              <button type="button" className="absolute right-3 top-2.5 text-xs font-bold text-gray-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 mb-3">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
            {resetMsg.text && <p className={`mb-3 text-xs font-bold p-2 rounded-lg ${resetMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{resetMsg.text}</p>}
            <button onClick={handlePasswordReset} disabled={isResetting} className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-2.5 rounded-lg text-sm">
              {isResetting ? 'Saving...' : 'Reset Password'}
            </button>
          </div>
        </div>
      )}

      {/* Create Examiner Modal */}
      {showExaminerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-8">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Create New Examiner</h2>
              <button onClick={() => setShowExaminerModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={examinerName} onChange={e => setExaminerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={examinerEmail} onChange={e => setExaminerEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Initial Password</label>
                <div className="relative">
                  <input type={showExaminerPassword ? "text" : "password"} value={examinerPassword} onChange={e => setExaminerPassword(e.target.value)} className="w-full px-3 py-2 pr-10 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue" />
                  <button type="button" className="absolute right-3 top-2.5 text-xs font-bold text-gray-400" onClick={() => setShowExaminerPassword(!showExaminerPassword)}>{showExaminerPassword ? 'Hide' : 'Show'}</button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">BSG ID (Optional)</label>
                <input type="text" value={examinerBsgId} onChange={e => setExaminerBsgId(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                <select value={examinerSection} onChange={e => { setExaminerSection(e.target.value); setExaminerRank(''); }} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue">
                  <option value="">Select Section</option>
                  <option value="Scout">Scout</option>
                  <option value="Guide">Guide</option>
                  <option value="Rover">Rover</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
              {examinerSection && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rank / Designation</label>
                  <input type="text" value={examinerRank} onChange={e => setExaminerRank(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue" placeholder={`Enter ${examinerSection} rank`} />
                </div>
              )}
            </div>

            {examinerMsg.text && <p className={`mt-4 text-xs font-bold p-2 rounded-lg ${examinerMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{examinerMsg.text}</p>}
            
            <button onClick={handleCreateExaminer} disabled={isCreatingExaminer} className="w-full mt-5 bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              {isCreatingExaminer ? 'Creating...' : 'Create Examiner'}
            </button>
          </div>
        </div>
      )}

      {/* Delete & Insights Modals stay structurally similar but lightened */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Delete {userToDelete?.name}?</h2>
            <p className="text-gray-600 text-sm mb-4">This cannot be undone. Enter your Admin password to confirm.</p>
            <input type="password" value={adminPasswordForDelete} onChange={e => setAdminPasswordForDelete(e.target.value)} className="w-full px-3 py-2 border border-rose-200 rounded-lg outline-none text-sm mb-3 focus:ring-2 focus:ring-rose-500" placeholder="Admin Password" />
            {deleteError && <p className="text-xs text-rose-600 mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handlePermanentDelete} className="flex-1 bg-rose-600 text-white font-bold py-2 rounded-lg text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl my-8">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Examiner Insights</h2>
                <p className="text-xs text-gray-500">{selectedExaminer?.name}</p>
              </div>
              <button onClick={() => setShowInsightsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            {loadingInsights ? (
              <div className="text-center py-8 text-gray-500 text-sm font-medium">Loading insights...</div>
            ) : insightsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase">Exams Created</p>
                    <p className="text-2xl font-black text-blue-900">{insightsData.exams.length}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-500 uppercase">Total Submissions</p>
                    <p className="text-2xl font-black text-emerald-900">{insightsData.attempts.length}</p>
                  </div>
                </div>
                {insightsData.exams.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold mb-2 text-gray-700">Recent Exams</h3>
                    <ul className="text-sm divide-y divide-gray-100 border border-gray-100 rounded-lg">
                      {insightsData.exams.slice(0, 5).map((e: any) => (
                        <li key={e._id} className="p-3 flex justify-between">
                          <span className="font-medium text-gray-800">{e.title}</span>
                          <span className="text-xs text-gray-500">{e.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
               <div className="text-center py-8 text-gray-500 text-sm font-medium">No data found.</div>
            )}
          </div>
        </div>
      )}

      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Bulk Import</h2>
              <button onClick={() => setShowBulkImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <input type="file" accept=".csv" onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)} className="w-full text-sm mb-4" />
            <button onClick={handleBulkImport} disabled={!bulkImportFile || isBulkImporting} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
              {isBulkImporting ? 'Importing...' : 'Upload CSV'}
            </button>
            {bulkImportResult && (
              <div className="mt-4 p-3 bg-gray-50 border rounded-lg text-xs">
                <p className="font-bold">{bulkImportResult.message}</p>
              </div>
            )}
           </div>
        </div>
      )}

    </div>
  );
}
