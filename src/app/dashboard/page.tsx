'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { UserCircle, Settings } from 'lucide-react';
import '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category?: string;
  questionCount?: number;
  maxScore?: number;
  creatorName?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  createdAt?: string;
}



export default function CandidateDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterExaminer, setFilterExaminer] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Redirect Admin and Examiner to their respective dashboards
    if (user?.role === 'Admin') {
      router.push('/admin');
      return;
    }
    if (user?.role === 'Examiner') {
      router.push('/examiner');
      return;
    }

    if (user?.role === 'Candidate') {
      const fetchCandidateData = async () => {
        try {
          const examsRes = await axios.get(`${API_URL}/api/exams/available`, { withCredentials: true });
          
          const sortedExams = examsRes.data.sort((a: any, b: any) => {
            const dateA = new Date(a.scheduledStartDate || a.createdAt || Date.now()).getTime();
            const dateB = new Date(b.scheduledStartDate || b.createdAt || Date.now()).getTime();
            return dateB - dateA;
          });
          setAvailableExams(sortedExams);
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            logout();
            router.push('/login');
          } else {
            console.error('Error fetching dashboard data:', error);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchCandidateData();
    }
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading your CBT Portal..." />;
  if (!isAuthenticated || user?.role !== 'Candidate') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile Section */}
      <div className="bg-gradient-to-r from-bsg-blue to-bsg-blue-light rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10 text-center sm:text-left w-full">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-bsg-blue text-3xl font-extrabold shadow-inner overflow-hidden border-4 border-white/20">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; }} />
              ) : (
                <UserCircle size={48} className="text-gray-300" />
              )}
            </div>
          </div>
          <div className="flex-1 mt-2 sm:mt-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1">Welcome, {user?.name}</h1>
            <div className="flex flex-wrap items-center sm:items-start gap-2 text-blue-100 font-medium mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-sm border border-white/10">BSG ID: {user?.bsgId}</span>
              {user?.district && <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-sm border border-white/10">District: {user.district}</span>}
              {user?.section && <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-sm border border-white/10">Section: {user.section}</span>}
              {user?.unitName && <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-sm border border-white/10">Unit: {user.unitNumber ? `#${user.unitNumber} ` : ''}{user.unitName}</span>}
            </div>
          </div>
        </div>
        
        {/* Removed Edit Profile button as requested */}
      </div>

      {/* Available Exams Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <h2 className="text-2xl font-extrabold text-gray-900">Available Exams</h2>
            <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
              {availableExams.length} New
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search exams..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none min-w-[200px]"
            />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none"
            >
              <option value="All">All Categories</option>
              {Array.from(new Set(availableExams.map(e => e.category || 'General'))).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select 
              value={filterExaminer} 
              onChange={(e) => setFilterExaminer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none"
            >
              <option value="All">All Examiners</option>
              {Array.from(new Set(availableExams.map(e => e.creatorName || 'Unknown Examiner'))).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>
        
        {availableExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re all caught up!</h3>
            <p className="text-gray-500">There are no new exams assigned to you at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableExams
              .filter(exam => filterCategory === 'All' || (exam.category || 'General') === filterCategory)
              .filter(exam => filterExaminer === 'All' || (exam.creatorName || 'Unknown Examiner') === filterExaminer)
              .filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((exam: Exam) => (
              <div key={exam._id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col transform hover:-translate-y-1 group">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-bsg-gold/20 text-yellow-800 text-xs font-extrabold uppercase tracking-wider rounded-full">
                      {exam.category || 'General'}
                    </span>
                    <span className="flex items-center text-gray-500 text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">
                      ⏱️ {exam.durationMinutes} mins
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-bsg-blue transition-colors">{exam.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{exam.description || 'No description provided.'}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-500 font-medium">Created By:</p>
                      <p className="text-xs font-bold text-gray-700">{exam.creatorName || 'Unknown Examiner'}</p>
                    </div>
                    {exam.scheduledStartDate ? (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-blue-500 font-medium">Scheduled For:</p>
                        <p className="text-xs font-bold text-blue-700">{new Date(exam.scheduledStartDate).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 font-medium">Published:</p>
                        <p className="text-xs font-bold text-gray-600">{new Date(exam.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t border-gray-100">
                    <span className="font-semibold text-gray-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {exam.questionCount || 0} Qs</span>
                    <span className="font-semibold text-gray-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> {exam.maxScore || 0} Marks</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <Link 
                    href={`/exams/${exam._id}/start`} 
                    className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-bsg-blue-dark bg-bsg-gold hover:bg-yellow-500 transition-colors shadow-sm"
                  >
                    Start Exam Now &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
