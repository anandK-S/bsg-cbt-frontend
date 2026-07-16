'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Search, FileText, Activity, Users, Settings, LogOut, CheckCircle, Clock } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'respondents', 'help'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchExams = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/exams`, {
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
    if (activeTab === 'respondents') {
      fetchLiveAttempts();
      const interval = setInterval(fetchLiveAttempts, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);
  
  // Timer for live countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (activeTab === 'respondents') {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Examiner Portal..." />;
  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  const categories = ['All', ...Array.from(new Set(exams.map(e => e.category).filter(Boolean)))];
  
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || exam.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || exam.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* Horizontal Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('tests')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'tests' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <FileText size={18} /> My Tests
            </button>
            <button 
              onClick={() => setActiveTab('respondents')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'respondents' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <Activity size={18} /> Live Monitoring
            </button>
            <button 
              onClick={() => setActiveTab('help')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'help' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <HelpCircle size={18} /> Help & Tutorials
            </button>
            <Link 
              href="/profile"
              className="whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 flex items-center gap-2"
            >
              <Settings size={18} /> Profile Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto py-8">
        {activeTab === 'tests' && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">My Tests</h1>
                <p className="text-gray-500 font-medium text-sm">Manage, edit, and monitor your computer-based tests.</p>
              </div>
              <Link 
                href="/examiner/exams/create" 
                className="bg-bsg-blue hover:bg-bsg-blue-dark text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 flex-shrink-0"
              >
                <span className="text-xl leading-none">+</span> New test
              </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all"
                >
                  <option value="All">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c as string}>{c as string}</option>
                  ))}
                </select>
                <select 
                  onChange={(e) => {
                    const val = e.target.value;
                    const sorted = [...exams].sort((a, b) => {
                      // fallback logic for date, usually exams have _id we can sort by or createdAt
                      const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
                      const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
                      return val === 'newest' ? dateB - dateA : dateA - dateB;
                    });
                    setExams(sorted);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-bsg-blue focus:border-transparent transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No tests found</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-md">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredExams.map(exam => (
                  <div key={exam._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <span className="bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                          {exam.category || 'Uncategorized'}
                        </span>
                        <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${exam.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          <span className={`w-2 h-2 rounded-full ${exam.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          {exam.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-2">{exam.title}</h3>
                      <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-4">{exam.description || 'No description provided.'}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-auto">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <Clock size={16} className="text-bsg-blue" />
                          {exam.durationMinutes} mins
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <FileText size={16} className="text-bsg-gold" />
                          {exam.questionCount || 0} Qs
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                          <Users size={16} className="text-green-600" />
                          {exam.attemptCount || 0} Taken
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                      <Link 
                        href={`/examiner/exams/${exam._id}`}
                        className="w-full block text-center bg-white border border-gray-200 hover:border-bsg-blue hover:text-bsg-blue text-gray-800 font-bold py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Manage Test Configuration
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'respondents' && (
          <div className="px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Live Monitoring</h2>
            <p className="text-gray-500 font-medium text-sm mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Auto-updating live exam attempts
            </p>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Candidate Details</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Exam Title</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Time Left</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Warnings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liveAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                          No candidates are currently taking exams.
                        </td>
                      </tr>
                    ) : (
                      liveAttempts.map((attempt) => {
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
                          <tr key={attempt._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{attempt.candidateId?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">{attempt.candidateId?.bsgId || 'No ID'} | {attempt.candidateId?.section || 'No Section'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{attempt.examId?.title || 'Unknown Exam'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{startTime}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-black ${liveTimeLeft < 60 ? 'text-red-600' : 'text-bsg-blue'} font-mono bg-gray-100 px-3 py-1 rounded-md`}>
                                {timeString}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {attempt.warnings > 0 ? (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-black rounded-full bg-red-100 text-red-800">
                                  {attempt.warnings} / 3
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500 font-medium">0 / 3</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-6">How to use the Examiner Portal</h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText className="text-bsg-blue" size={20}/> 1. Creating a New Test</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Navigate to the <strong>My Tests</strong> tab and click on the blue <strong>+ New Test</strong> button. Provide a title, description, and the time limit in minutes. You can also specify an optional scheduled Start Date and End Date to restrict when candidates can access it.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><HelpCircle className="text-bsg-blue" size={20}/> 2. Adding Questions</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Inside your test configuration, you have two options:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-4 font-medium">
                  <li><strong>Manual Entry:</strong> Type your question, add options, and select the correct answer. You can optionally include images via URL.</li>
                  <li><strong>AI Bulk Import:</strong> Upload a `.txt`, `.pdf`, or `.docx` file containing multiple choice questions, and our AI will automatically parse and insert them into your exam!</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="text-bsg-blue" size={20}/> 3. Publishing and Monitoring</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Once your questions are ready, click <strong>Publish Exam</strong>. Candidates will now see this exam in their dashboards (if within the scheduled dates). You can switch to the <strong>Live Monitoring</strong> tab to watch candidates' progress and their strict anti-cheat warnings in real-time.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Database className="text-bsg-blue" size={20}/> 4. Viewing Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  To view results, click on a test in <strong>My Tests</strong>, then navigate to the <strong>Results Database</strong> section inside the configuration page. You can export scores to CSV or click <strong>Review</strong> to see exactly what the candidate answered.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
