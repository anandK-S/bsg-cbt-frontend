'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import '@/utils/apiConfig';

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
  questions?: unknown[];
}

export default function ExaminerDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }

    const fetchExams = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/exams', {
          withCredentials: true,
        });
        setExams(data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
          router.push('/login');
        } else {
          console.error('Error fetching exams:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  if (loading || !_hasHydrated) return <div className="min-h-[60vh] flex items-center justify-center text-primary font-semibold text-xl">Loading Examiner Dashboard...</div>;
  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  const totalExams = exams.length;
  const publishedExams = exams.filter(e => e.status === 'Published').length;
  const draftExams = exams.filter(e => e.status === 'Draft').length;

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-bsg-blue to-bsg-blue-dark rounded-3xl p-8 mb-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Examiner Dashboard</h1>
          <p className="text-blue-100 text-lg font-medium">Manage your question papers, monitor candidates, and review analytics.</p>
        </div>
        <Link href="/examiner/exams/create" className="relative z-10 bg-bsg-gold text-bsg-blue-dark px-8 py-4 rounded-xl font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 flex items-center justify-center gap-2">
          <span className="text-2xl leading-none">+</span> Create New Exam
        </Link>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-blue-50 text-bsg-blue mr-5 text-3xl shadow-inner">📝</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Exams</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{totalExams}</dd>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-green-50 text-green-600 mr-5 text-3xl shadow-inner">🚀</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Published</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{publishedExams}</dd>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center transform hover:scale-105 transition-transform duration-300">
          <div className="p-4 rounded-xl bg-yellow-50 text-yellow-600 mr-5 text-3xl shadow-inner">✏️</div>
          <div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Drafts</dt>
            <dd className="mt-1 text-4xl font-black text-gray-900">{draftExams}</dd>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search exams by title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-bsg-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['All', 'Published', 'Draft'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-bsg-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Grid List */}
      <div className="mb-10">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center text-gray-500 border border-gray-200 flex flex-col items-center">
            <div className="text-6xl mb-6 bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center">🗂️</div>
            <p className="text-2xl font-bold text-gray-800 mb-2">No exams found</p>
            <p className="text-gray-500 max-w-md mx-auto">We couldn't find any exams matching your current filters. Try adjusting your search or create a new exam.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredExams.map((exam: Exam) => (
              <div key={exam._id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-800 text-xs font-black uppercase tracking-wider rounded-full">
                      {exam.category || 'General'}
                    </span>
                    <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1 ${exam.status === 'Published' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${exam.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {exam.status}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-bsg-blue transition-colors" title={exam.title}>{exam.title}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</span>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        ⏱️ {exam.durationMinutes} mins
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Questions</span>
                      <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        ❓ {exam.questions?.length || 0} Qs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 group-hover:bg-blue-50 transition-colors border-t border-gray-100">
                  <Link 
                    href={`/examiner/exams/${exam._id}`} 
                    className="w-full flex justify-center items-center px-6 py-3 rounded-xl text-sm font-black text-bsg-blue hover:text-white hover:bg-bsg-blue transition-all"
                  >
                    Manage Exam &rarr;
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
