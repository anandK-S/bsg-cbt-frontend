'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Search, FileText, Activity, Users, HelpCircle, Database, Calendar, Clock, Plus, ChevronRight, Eye } from 'lucide-react';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
  questions?: unknown[];
  questionCount?: number;
  attemptCount?: number;
  createdAt?: string;
}

interface LiveAttempt {
  _id: string;
  candidateId: { name: string; bsgId: string; section: string };
  examId: { title: string };
  startTime: string;
  timeRemaining: number;
  warnings: number;
  updatedAt: string;
}

export default function ExaminerDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [liveAttempts, setLiveAttempts] = useState<LiveAttempt[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'live', 'help'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchExams = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/exams`, {
        withCredentials: true,
      });
      // Default sort: newest first
      const sorted = [...data].sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setExams(sorted);
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

  const fetchLiveAttempts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/attempts/live`, {
        withCredentials: true,
      });
      setLiveAttempts(data);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching live attempts:', error);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }
    fetchExams();
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveAttempts();
      const interval = setInterval(fetchLiveAttempts, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);
  
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (activeTab === 'live') {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Examiner Portal..." />;
  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  const categories = ['All', ...Array.from(new Set(exams.map(e => e.category).filter(Boolean)))];
  
  // Apply all filters then sort
  const filteredExams = exams
    .filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || exam.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || exam.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const publishedCount = exams.filter(e => e.status === 'Published').length;
  const draftCount = exams.filter(e => e.status === 'Draft').length;
  const totalAttempts = exams.reduce((sum, e) => sum + (e.attemptCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">

        {/* ── Premium Header ── */}
        <div className="bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl md:rounded-[2rem] p-6 md:p-10 mb-6 sm:mb-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow-lg" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xl border-2 border-white/30">
                    {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                )}
                <div>
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Examiner Portal</p>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    Welcome, {user?.name?.split(' ')[0] || 'Examiner'}
                  </h1>
                </div>
              </div>
            </div>

            <Link
              href="/examiner/exams/create"
              className="flex items-center gap-2 bg-bsg-gold hover:bg-yellow-400 text-bsg-blue-dark font-extrabold px-5 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 text-sm sm:text-base shrink-0"
            >
              <Plus size={18} />
              <span>New Test</span>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/20">
              <p className="text-2xl sm:text-3xl font-black">{exams.length}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-0.5">Total Tests</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/20">
              <p className="text-2xl sm:text-3xl font-black text-bsg-gold">{publishedCount}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-0.5">Published</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/20">
              <p className="text-2xl sm:text-3xl font-black">{totalAttempts}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-0.5">Attempts</p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 ring-1 ring-black/5 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { id: 'tests', icon: FileText, label: 'My Tests' },
              { id: 'live', icon: Activity, label: 'Live Monitoring' },
              { id: 'help', icon: HelpCircle, label: 'Help & Tutorials' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-bsg-blue text-bsg-blue bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'live' && liveAttempts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {liveAttempts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── MY TESTS Tab ── */}
          {activeTab === 'tests' && (
            <div className="p-4 sm:p-6">
              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="col-span-2 sm:col-span-2 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsg-blue transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsg-blue transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {filteredExams.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText size={36} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">No tests found</h3>
                  <p className="text-gray-500 font-medium mb-6">Try adjusting your search or filters, or create a new test.</p>
                  <Link href="/examiner/exams/create" className="bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:-translate-y-0.5">
                    + Create Your First Test
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {filteredExams.map((exam) => (
                    <div key={exam._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden ring-1 ring-black/[0.03]">
                      {/* Card Top */}
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className="bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full max-w-[120px] truncate">
                            {exam.category || 'General'}
                          </span>
                          <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${exam.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${exam.status === 'Published' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            {exam.status}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1.5 line-clamp-2 leading-snug">{exam.title}</h3>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium line-clamp-2 mb-4">{exam.description || 'No description provided.'}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            <Clock size={12} className="text-bsg-blue" />
                            {exam.durationMinutes}m
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            <FileText size={12} className="text-bsg-gold" />
                            {exam.questionCount || 0} Qs
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            <Users size={12} className="text-green-600" />
                            {exam.attemptCount || 0} Taken
                          </div>
                          {exam.createdAt && (
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                              <Calendar size={12} />
                              {new Date(exam.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Card Footer */}
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                        <Link
                          href={`/examiner/exams/${exam._id}`}
                          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-bsg-blue hover:text-bsg-blue text-gray-700 font-bold py-2 rounded-xl transition-all text-sm shadow-sm"
                        >
                          <Eye size={15} />
                          Manage Test
                          <ChevronRight size={14} className="ml-auto" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LIVE MONITORING Tab ── */}
          {activeTab === 'live' && (
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-extrabold text-gray-900">Live Monitoring</h2>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Auto-refreshing
                </div>
              </div>
              
              {liveAttempts.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Activity size={36} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">No Active Candidates</h3>
                  <p className="text-gray-500 font-medium">No one is currently taking an exam.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Exam</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell">Start Time</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Time Left</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Warnings</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {liveAttempts.map((attempt) => {
                        const startTime = (attempt as any).startTime ? new Date((attempt as any).startTime).toLocaleTimeString() : 'N/A';
                        let liveTimeLeft = attempt.timeRemaining;
                        if ((attempt as any).startTime) {
                          const timeSinceSync = Math.floor((now - lastFetchTime) / 1000);
                          liveTimeLeft = Math.max(0, attempt.timeRemaining - timeSinceSync);
                        }
                        const m = Math.floor(liveTimeLeft / 60);
                        const s = liveTimeLeft % 60;
                        const timeString = `${m}:${s.toString().padStart(2, '0')}`;

                        return (
                          <tr key={attempt._id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-sm">{attempt.candidateId?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-400">{attempt.candidateId?.bsgId} · {attempt.candidateId?.section}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-gray-700">{attempt.examId?.title || 'Unknown'}</span>
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">
                              <span className="text-sm text-gray-500">{startTime}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-sm font-black font-mono ${liveTimeLeft < 60 ? 'text-red-600 bg-red-50' : 'text-bsg-blue bg-blue-50'} px-2.5 py-1 rounded-lg`}>
                                {timeString}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {attempt.warnings > 0 ? (
                                <span className="px-2.5 py-1 text-xs font-black rounded-full bg-red-100 text-red-700">
                                  {attempt.warnings}/3
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">0/3</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── HELP Tab ── */}
          {activeTab === 'help' && (
            <div className="p-4 sm:p-6 max-w-3xl">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-5">How to use the Examiner Portal</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: FileText,
                    color: 'text-bsg-blue',
                    bg: 'bg-blue-50',
                    title: '1. Creating a New Test',
                    text: 'Click the "New Test" button. Provide a title, description, and time limit. You can also set a scheduled Start Date and End Date to restrict access.'
                  },
                  {
                    icon: HelpCircle,
                    color: 'text-bsg-gold',
                    bg: 'bg-amber-50',
                    title: '2. Adding Questions',
                    text: 'Inside your test, use Manual Entry to type questions and options, or use AI Bulk Import to upload a .txt/.pdf/.docx file and let AI parse questions automatically.'
                  },
                  {
                    icon: Users,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    title: '3. Publishing and Monitoring',
                    text: 'Click "Publish Exam" when ready. Candidates will see it in their dashboards. Switch to "Live Monitoring" to watch candidate progress and anti-cheat warnings in real-time.'
                  },
                  {
                    icon: Database,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                    title: '4. Viewing Results',
                    text: 'Open any test, then navigate to the Results Database section. Export scores to CSV or click "Review" to see exactly what each candidate answered.'
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-base font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                      <div className={`w-8 h-8 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <item.icon size={16} className={item.color} />
                      </div>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
