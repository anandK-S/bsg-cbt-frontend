'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { LayoutDashboard, Users, Database, Settings, HelpCircle, FileText, Activity, Search } from 'lucide-react';
import '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface Exam {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: string;
  category?: string;
  questions?: unknown[];
}

interface LiveAttempt {
  _id: string;
  candidateId: { name: string; bsgId: string; section: string };
  examId: { title: string };
  status: string;
  timeRemaining: number;
  warnings: number;
  updatedAt: string;
}

export default function ExaminerDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [liveAttempts, setLiveAttempts] = useState<LiveAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'respondents', 'help'

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

  const fetchLiveAttempts = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/attempts/live', {
        withCredentials: true,
      });
      setLiveAttempts(data);
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

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Examiner Portal..." />;
  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

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
              <Users size={18} /> Live Monitoring
            </button>
            <button 
              onClick={() => setActiveTab('help')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'help' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <HelpCircle size={18} /> Help & Tutorials
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto py-8">
        {activeTab === 'tests' && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
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

            {exams.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No tests created yet</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-md">You haven't created any tests. Click the button below to set up your first computer-based test.</p>
                <Link 
                  href="/examiner/exams/create" 
                  className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all"
                >
                  Create New Test
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {exams.map(exam => (
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
                      
                      <div className="flex items-center gap-4 mt-auto">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <Activity size={16} className="text-bsg-blue" />
                          {exam.durationMinutes} mins
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
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Time Left</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Warnings</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {liveAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="text-4xl mb-4">👀</div>
                          <p className="font-bold text-gray-900 text-lg">No active exams right now.</p>
                          <p className="text-gray-500 text-sm">When candidates start an exam, they will appear here in real-time.</p>
                        </td>
                      </tr>
                    ) : (
                      liveAttempts.map((attempt) => (
                        <tr key={attempt._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-gray-900">{attempt.candidateId?.name}</div>
                            <div className="text-sm text-gray-500 font-medium">BSG ID: {attempt.candidateId?.bsgId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{attempt.examId?.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                            {Math.floor(attempt.timeRemaining / 60)}m {attempt.timeRemaining % 60}s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${attempt.warnings > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                              {attempt.warnings || 0} / 3
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {attempt.status}
                          </td>
                        </tr>
                      ))
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
