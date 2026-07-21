'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
  Users, ShieldCheck, UserX, UserCheck, Search, Filter, 
  Trash2, ChevronRight, Database, Plus, List, UserCog, Key, Settings as SettingsIcon, TrendingUp, X, Menu, LogOut, Edit2, ShieldAlert, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface User {
  _id: string;
  name: string;
  email: string;
  bsgId: string;
  section?: string;
  rank?: string;
  role: string;
  status: string;
  profileImage?: string;
  district?: string;
  lastLogin?: string;
  lastLogout?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
}

interface GlobalSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  termsUrl: string;
  privacyUrl: string;
  maxFailedLoginAttempts: number;
  require2FA: boolean;
  strictBrowserLockdown: boolean;
  defaultProctoringLevel: string;
}

interface AuditLog {
  _id: string;
  userId: { _id: string; name: string; email: string; role: string } | null;
  action: string;
  details: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'users' | 'exams' | 'profile' | 'settings' | 'audit'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('All');

  // Audit Filters
  const [auditRoleFilter, setAuditRoleFilter] = useState('All');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;

  // Modals Data
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', bsgId: '', section: '', rank: '', district: '' });
  const [editMsg, setEditMsg] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showExaminerModal, setShowExaminerModal] = useState(false);
  const [examinerData, setExaminerData] = useState({ name: '', email: '', password: '', bsgId: '', section: '', rank: '' });
  const [examinerMsg, setExaminerMsg] = useState({ text: '', type: '' });
  const [isCreatingExaminer, setIsCreatingExaminer] = useState(false);
  const [showExaminerPassword, setShowExaminerPassword] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [adminPasswordForDelete, setAdminPasswordForDelete] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedExaminer, setSelectedExaminer] = useState<User | null>(null);
  const [insightsData, setInsightsData] = useState<{ exams: any[], attempts: any[] } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', profileImage: '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<GlobalSettings | null>(null);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'Admin') {
      router.push('/');
      return;
    }

    setProfileForm({ name: user.name || '', email: user.email || '', password: '', profileImage: user.profileImage || '' });

    const fetchData = async () => {
      try {
        const [usersRes, examsRes, settingsRes, auditRes] = await Promise.all([
          axios.get(`${API_URL}/api/users`, { withCredentials: true }),
          axios.get(`${API_URL}/api/exams`, { withCredentials: true }),
          axios.get(`${API_URL}/api/settings`, { withCredentials: true }),
          axios.get(`${API_URL}/api/users/audit-logs`, { withCredentials: true })
        ]);
        setUsers(usersRes.data);
        setExams(examsRes.data);
        setGlobalSettings(settingsRes.data);
        setSettingsForm(settingsRes.data);
        setAuditLogs(auditRes.data);
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
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

  // Actions
  const toggleBlockStatus = async (userId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'Active' ? 'block' : 'unblock';
      await axios.put(`${API_URL}/api/users/${userId}/${action}`, {}, { withCredentials: true });
      setUsers(users.map(u => u._id === userId ? { ...u, status: currentStatus === 'Active' ? 'Blocked' : 'Active' } : u));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSubmit = async () => {
    setIsEditing(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/users/${userToEdit?._id}/update`, editFormData, { withCredentials: true });
      setUsers(users.map(u => u._id === userToEdit?._id ? data.user : u));
      setEditMsg({ text: 'User updated successfully!', type: 'success' });
      setTimeout(() => {
        setShowEditModal(false);
        setEditMsg({ text: '', type: '' });
      }, 1500);
    } catch (error: any) {
      setEditMsg({ text: error.response?.data?.message || 'Failed to update user', type: 'error' });
    } finally {
      setIsEditing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({ text: '', type: '' });

    if (profileForm.password && !passwordRegex.test(profileForm.password)) {
      setProfileMsg({ text: 'Password must be 6+ chars, include a letter, number, and special char.', type: 'error' });
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const payload: any = { name: profileForm.name, email: profileForm.email, profileImage: profileForm.profileImage };
      if (profileForm.password) payload.password = profileForm.password;

      await axios.put(`${API_URL}/api/auth/me/profile`, payload, { withCredentials: true });
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setProfileForm({ ...profileForm, password: '' });
    } catch (error: any) {
      setProfileMsg({ text: error.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    setSettingsMsg({ text: '', type: '' });

    try {
      const { data } = await axios.put(`${API_URL}/api/settings`, settingsForm, { withCredentials: true });
      setGlobalSettings(data);
      setSettingsForm(data);
      setSettingsMsg({ text: 'Settings updated successfully!', type: 'success' });
    } catch (error: any) {
      setSettingsMsg({ text: error.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/users/${userId}/unlock`, {}, { withCredentials: true });
      setUsers(users.map(u => u._id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: undefined } : u));
    } catch (error) {
      console.error(error);
      alert("Failed to unlock user.");
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditRoleFilter !== 'All' && log.userId?.role !== auditRoleFilter) return false;
    if (auditDateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== auditDateFilter) return false;
    }
    return true;
  });

  const exportAuditPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('Admin Security Audit Log', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    let subtitle = `Generated on: ${new Date().toLocaleString()}`;
    if (auditRoleFilter !== 'All') subtitle += ` | Role: ${auditRoleFilter}`;
    if (auditDateFilter) subtitle += ` | Date: ${auditDateFilter}`;
    doc.text(subtitle, 14, 30);
    
    const tableData = filteredAuditLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userId ? log.userId.name : 'Unknown User',
      log.userId ? log.userId.role : 'N/A',
      log.action,
      log.details
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Timestamp', 'User', 'Role', 'Action', 'Details']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save('BSG-CBT-Security-Audit.pdf');
  };

  const handlePasswordReset = async () => {
    if (!passwordRegex.test(newPassword)) {
      setResetMsg({ text: 'Password must be 6+ chars, include a letter, number, and special character.', type: 'error' });
      return;
    }
    setIsResetting(true);
    try {
      await axios.put(`${API_URL}/api/users/${selectedUser?._id}/password`, { newPassword }, { withCredentials: true });
      setResetMsg({ text: 'Password reset successfully!', type: 'success' });
      setTimeout(() => { setShowPasswordModal(false); setNewPassword(''); setResetMsg({text:'', type:''}); }, 1500);
    } catch (error: any) {
      setResetMsg({ text: error.response?.data?.message || 'Failed to reset', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateExaminer = async () => {
    if (!examinerData.name || !examinerData.email || !examinerData.password) {
      setExaminerMsg({ text: 'Name, email, and password are required', type: 'error' });
      return;
    }
    if (!passwordRegex.test(examinerData.password)) {
      setExaminerMsg({ text: 'Password must be 6+ chars, include a letter, number, and special char.', type: 'error' });
      return;
    }

    setIsCreatingExaminer(true);
    try {
      await axios.post(`${API_URL}/api/auth/create-examiner`, examinerData, { withCredentials: true });
      setExaminerMsg({ text: 'Examiner created successfully!', type: 'success' });
      const usersRes = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
      setUsers(usersRes.data);
      setTimeout(() => { 
        setShowExaminerModal(false); 
        setExaminerData({ name: '', email: '', password: '', bsgId: '', section: '', rank: '' });
        setExaminerMsg({text:'', type:''}); 
      }, 1500);
    } catch (error: any) {
      setExaminerMsg({ text: error.response?.data?.message || 'Failed to create examiner', type: 'error' });
    } finally {
      setIsCreatingExaminer(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!adminPasswordForDelete) return setDeleteError('Password required');
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/users/${userToDelete?._id}`, {
        data: { adminPassword: adminPasswordForDelete },
        withCredentials: true,
      });
      setUsers(users.filter(u => u._id !== userToDelete?._id));
      setShowDeleteModal(false);
      setAdminPasswordForDelete('');
    } catch (error: any) {
      setDeleteError(error.response?.data?.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchExaminerInsights = async (examiner: User) => {
    setSelectedExaminer(examiner);
    setShowInsightsModal(true);
    setLoadingInsights(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/users/examiner/${examiner._id}/insights`, { withCredentials: true });
      setInsightsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Admin Workspace..." />;
  if (!isAuthenticated || user?.role !== 'Admin') return null;

  const filteredUsers = users.filter((u) => {
    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
    const isOnline = u.lastLogin && (!u.lastLogout || new Date(u.lastLogin) > new Date(u.lastLogout));
    if (statusFilter === 'Locked' && !isLocked) return false;
    if (statusFilter === 'Online' && !isOnline) return false;

    return (roleFilter === 'All' || u.role === roleFilter) &&
           (sectionFilter === 'All' || u.section === sectionFilter) &&
           (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.bsgId && u.bsgId.toLowerCase().includes(searchQuery.toLowerCase())));
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="glass-card rounded-3xl overflow-hidden animate-[fade-in_0.4s_ease-out]">
            <div className="p-4 sm:p-5 border-b border-gray-200/50 bg-white/50 flex flex-col lg:flex-row justify-between gap-4">
              <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1 flex-1 sm:flex-none">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-transparent text-gray-700 text-sm focus:outline-none py-1.5 font-bold cursor-pointer w-full">
                    <option value="All">All Roles</option>
                    <option value="Candidate">Candidates</option>
                    <option value="Examiner">Examiners</option>
                    <option value="Admin">Admins</option>
                  </select>
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1 flex-1 sm:flex-none">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-gray-700 text-sm focus:outline-none py-1.5 font-bold cursor-pointer w-full">
                    <option value="All">All Status</option>
                    <option value="Locked">Locked Accounts</option>
                    <option value="Online">Online Now</option>
                  </select>
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1 flex-1 sm:flex-none">
                  <Filter size={14} className="text-gray-400 mr-2" />
                  <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="bg-transparent text-gray-700 text-sm focus:outline-none py-1.5 font-bold cursor-pointer w-full">
                    <option value="All">All Sections</option>
                    <option value="Scout">Scout</option>
                    <option value="Guide">Guide</option>
                    <option value="Rover">Rover</option>
                    <option value="Ranger">Ranger</option>
                    <option value="Leader">Leader</option>
                  </select>
                </div>
                <button onClick={() => setShowExaminerModal(true)} className="bg-bsg-blue hover:bg-bsg-blue-dark text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                  <Plus size={16} /> New Examiner
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Identity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status & Activity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Section</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((u: User) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{u.email} {u.bsgId && `| ${u.bsgId}`}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex gap-1 items-center">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Examiner' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{u.status}</span>
                            {(u.lockedUntil && new Date(u.lockedUntil) > new Date()) && (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-orange-100 text-orange-700">Locked</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                            <span className="font-bold text-gray-700">In:</span> {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'} | <span className="font-bold text-gray-700">Out:</span> {u.lastLogout ? new Date(u.lastLogout).toLocaleString() : 'Never'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-700">{u.section || '-'}</div>
                        {u.rank && <div className="text-xs text-gray-500 mt-0.5">{u.rank}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          {(u.lockedUntil && new Date(u.lockedUntil) > new Date()) && (
                            <button onClick={() => handleUnlock(u._id)} className="text-orange-600 hover:text-orange-900 font-bold bg-orange-50 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                              Unlock
                            </button>
                          )}
                          {u.role !== 'Admin' && (
                            <>
                              <button onClick={() => { 
                                setUserToEdit(u); 
                                setEditFormData({ name: u.name, email: u.email, bsgId: u.bsgId || '', section: u.section || '', rank: u.rank || '', district: u.district || '' });
                                setEditMsg({ text: '', type: '' });
                                setShowEditModal(true); 
                              }} className="text-gray-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => { setSelectedUser(u); setNewPassword(''); setResetMsg({text:'',type:''}); setShowPasswordModal(true); }} className="text-gray-400 hover:text-bsg-blue p-2 rounded-lg hover:bg-blue-50" title="Reset Password"><Key size={16} /></button>
                              <button onClick={() => toggleBlockStatus(u._id, u.status)} className={`p-2 rounded-lg ${u.status === 'Active' ? 'text-gray-400 hover:text-orange-500' : 'text-orange-500 hover:text-emerald-500'}`} title={u.status === 'Active' ? 'Block' : 'Unblock'}><ShieldCheck size={16} /></button>
                              <button onClick={() => { setUserToDelete(u); setAdminPasswordForDelete(''); setDeleteError(''); setShowDeleteModal(true); }} className="text-gray-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50" title="Delete"><Trash2 size={16} /></button>
                              {u.role === 'Examiner' && (
                                <button onClick={() => fetchExaminerInsights(u)} className="text-gray-400 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50" title="Insights"><TrendingUp size={16} /></button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Search className="mx-auto mb-3" size={24} />No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'exams':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-base font-bold text-gray-900">Platform Exams Overview</h3>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search exams..." value={examSearch} onChange={e => setExamSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-white" />
                </div>
                <select value={examStatusFilter} onChange={(e) => setExamStatusFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none">
                  <option value="All">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Exam Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Creator</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {exams.filter((e) => {
                    const mSearch = examSearch.toLowerCase();
                    if (examSearch && !e.title.toLowerCase().includes(mSearch) && !(e.category || '').toLowerCase().includes(mSearch)) return false;
                    if (examStatusFilter !== 'All' && e.status !== examStatusFilter) return false;
                    return true;
                  }).map((exam: Exam) => (
                    <tr key={exam._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{exam.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px] mt-1">{exam.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {/* @ts-ignore */}
                        {exam.creatorId?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${exam.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{exam.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => router.push(`/admin/exams/${exam._id}`)} className="text-bsg-blue hover:text-bsg-blue-dark font-bold text-sm inline-flex items-center gap-1">Inspect <ChevronRight size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><List className="mx-auto mb-3" size={24} />No exams yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'audit':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Security Audit Logs</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Full history of user logins and logouts.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <select value={auditRoleFilter} onChange={(e) => setAuditRoleFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none w-full sm:w-auto">
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Examiner">Examiner</option>
                  <option value="Candidate">Candidate</option>
                </select>
                <input type="date" value={auditDateFilter} onChange={(e) => setAuditDateFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none w-full sm:w-auto" />
                <button onClick={exportAuditPDF} className="bg-bsg-blue hover:bg-bsg-blue-dark text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto whitespace-nowrap">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredAuditLogs.map((log: AuditLog) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {log.userId ? (
                          <>
                            <div className="text-sm font-bold text-gray-900">{log.userId.name}</div>
                            <div className="text-xs text-gray-500">{log.userId.email} | <span className="font-bold text-gray-700">{log.userId.role}</span></div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 italic">Deleted / Unknown User</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${log.action === 'LOGIN' ? 'bg-emerald-100 text-emerald-700' : log.action === 'LOGOUT' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><ShieldAlert className="mx-auto mb-3" size={24} />No audit logs found for these filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900">Admin Profile Settings</h3>
              <p className="text-sm text-gray-500 font-medium">Update your account information and credentials.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Profile Image URL</label>
                  <input type="url" value={profileForm.profileImage} onChange={e => setProfileForm({...profileForm, profileImage: e.target.value})} placeholder="https://example.com/photo.jpg" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-gray-50" />
                  {profileForm.profileImage && (
                    <img src={profileForm.profileImage} alt="Preview" className="mt-3 w-16 h-16 rounded-full object-cover border border-gray-200" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} placeholder="Leave blank to keep current" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
                </div>
                
                {profileMsg.text && <div className={`p-3 rounded-lg text-sm font-bold ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{profileMsg.text}</div>}
                
                <div className="pt-2">
                  <button type="submit" disabled={isUpdatingProfile} className="bg-bsg-blue text-white font-bold px-6 py-3 rounded-xl hover:bg-bsg-blue-dark transition-colors">
                    {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900">Global Portal Settings</h3>
              <p className="text-sm text-gray-500 font-medium">Configure security, branding, and proctoring defaults.</p>
            </div>
            {settingsForm ? (
              <div className="p-6">
                <form onSubmit={handleUpdateSettings} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Branding Section */}
                    <div className="col-span-1 md:col-span-2">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Branding & Links</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Platform Name</label>
                          <input type="text" value={settingsForm.platformName} onChange={e => setSettingsForm({...settingsForm, platformName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Support Email</label>
                          <input type="email" value={settingsForm.supportEmail} onChange={e => setSettingsForm({...settingsForm, supportEmail: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
                        </div>
                      </div>
                    </div>

                    {/* Security Section */}
                    <div className="col-span-1 md:col-span-2">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b pb-2 mt-2">Security & Access</h4>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Max Failed Login Attempts</label>
                          <input type="number" min="1" max="20" value={settingsForm.maxFailedLoginAttempts} onChange={e => setSettingsForm({...settingsForm, maxFailedLoginAttempts: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
                          <p className="text-[11px] text-gray-500 mt-1">Locks account for 15 mins after threshold.</p>
                        </div>
                        
                        <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <input type="checkbox" checked={settingsForm.maintenanceMode} onChange={e => setSettingsForm({...settingsForm, maintenanceMode: e.target.checked})} className="mt-1 w-5 h-5 text-bsg-blue rounded" />
                          <div>
                            <span className="block text-sm font-bold text-gray-900">Maintenance Mode</span>
                            <span className="block text-xs text-gray-500 mt-0.5">Blocks candidates and examiners from logging in.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                  {settingsMsg.text && <div className={`p-3 rounded-lg text-sm font-bold ${settingsMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{settingsMsg.text}</div>}
                  
                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={isUpdatingSettings} className="bg-bsg-blue text-white font-bold px-8 py-3 rounded-xl hover:bg-bsg-blue-dark transition-colors">
                      {isUpdatingSettings ? 'Saving...' : 'Save Global Settings'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
               <div className="p-8 text-center text-gray-500">Loading settings...</div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 w-full">
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          
          {/* Top Tabs */}
          <div className="mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-2 justify-center sm:justify-start">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'bg-bsg-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Users size={18} /> {t('userManagement') || 'User Management'}
            </button>
            <button onClick={() => setActiveTab('exams')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'exams' ? 'bg-bsg-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <List size={18} /> {t('platformExams') || 'Platform Exams'}
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-bsg-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <SettingsIcon size={18} /> {t('globalSettings') || 'Global Settings'}
            </button>
            <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'bg-bsg-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <ShieldAlert size={18} /> Audit & History
            </button>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'bg-bsg-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <UserCog size={18} /> {t('adminProfile') || 'Admin Profile'}
            </button>
          </div>
          
          {/* Stats Grid - Only show on users or exams tab */}
          {(activeTab === 'users' || activeTab === 'exams') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[
                { label: t('totalUsers') || 'Total Users', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: t('activeCandidates') || 'Active Candidates', value: users.filter(u => u.status === 'Active' && u.role === 'Candidate').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: t('blockedAccounts') || 'Blocked Accounts', value: users.filter(u => u.status === 'Blocked').length, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: t('totalExams') || 'Total Exams', value: exams.length, icon: Database, color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map((stat, i) => (
                <div key={i} className="glass-card rounded-3xl p-5 border-gray-100/50 shadow-sm flex items-center gap-4 transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg animate-[fade-in_0.5s_ease-out]" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                    <stat.icon size={24} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {renderContent()}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-8">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Edit User Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">BSG ID</label>
                <input type="text" value={editFormData.bsgId} onChange={e => setEditFormData({...editFormData, bsgId: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                <select value={editFormData.section} onChange={e => setEditFormData({...editFormData, section: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50">
                  <option value="">None</option>
                  <option value="Scout">Scout</option>
                  <option value="Guide">Guide</option>
                  <option value="Rover">Rover</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                <input type="text" value={editFormData.district} onChange={e => setEditFormData({...editFormData, district: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rank / Designation</label>
                <input type="text" value={editFormData.rank} onChange={e => setEditFormData({...editFormData, rank: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
            </div>
            {editMsg.text && <p className={`mt-4 text-xs font-bold p-2 rounded-lg ${editMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{editMsg.text}</p>}
            <button onClick={handleEditSubmit} disabled={isEditing} className="w-full mt-5 bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              {isEditing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Modals from before */}
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
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-bsg-blue outline-none text-sm bg-gray-50" placeholder="New Secure Password" />
              <button type="button" className="absolute right-3 top-2.5 text-xs font-bold text-gray-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 mb-3">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
            {resetMsg.text && <p className={`mb-3 text-xs font-bold p-2 rounded-lg ${resetMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{resetMsg.text}</p>}
            <button onClick={handlePasswordReset} disabled={isResetting} className="w-full bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
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
              <h2 className="text-xl font-bold text-gray-900">Create Examiner</h2>
              <button onClick={() => setShowExaminerModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={examinerData.name} onChange={e => setExaminerData({...examinerData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={examinerData.email} onChange={e => setExaminerData({...examinerData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Initial Password</label>
                <div className="relative">
                  <input type={showExaminerPassword ? "text" : "password"} value={examinerData.password} onChange={e => setExaminerData({...examinerData, password: e.target.value})} className="w-full px-3 py-2 pr-10 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
                  <button type="button" className="absolute right-3 top-2.5 text-xs font-bold text-gray-400" onClick={() => setShowExaminerPassword(!showExaminerPassword)}>{showExaminerPassword ? 'Hide' : 'Show'}</button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Min 6 chars, 1 letter, 1 number, 1 special char.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">BSG ID (Optional)</label>
                <input type="text" value={examinerData.bsgId} onChange={e => setExaminerData({...examinerData, bsgId: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                <select value={examinerData.section} onChange={e => setExaminerData({...examinerData, section: e.target.value, rank: ''})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50">
                  <option value="">Select Section</option>
                  <option value="Scout">Scout</option>
                  <option value="Guide">Guide</option>
                  <option value="Rover">Rover</option>
                  <option value="Ranger">Ranger</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
              {examinerData.section && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rank / Designation</label>
                  <input type="text" value={examinerData.rank} onChange={e => setExaminerData({...examinerData, rank: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-bsg-blue bg-gray-50" placeholder={`Enter rank`} />
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-rose-600 mb-2">Delete {userToDelete?.name}?</h2>
            <p className="text-gray-600 text-sm mb-4">This cannot be undone. Enter your Admin password to confirm.</p>
            <input type="password" value={adminPasswordForDelete} onChange={e => setAdminPasswordForDelete(e.target.value)} className="w-full px-3 py-2 border border-rose-200 rounded-lg outline-none text-sm mb-3 focus:ring-2 focus:ring-rose-500 bg-gray-50" placeholder="Admin Password" />
            {deleteError && <p className="text-xs text-rose-600 mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handlePermanentDelete} disabled={isDeleting} className="flex-1 bg-rose-600 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50">
                {isDeleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
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
              </div>
            ) : (
               <div className="text-center py-8 text-gray-500 text-sm font-medium">No data found.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
