'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { LayoutDashboard, Users, Database, Settings, HelpCircle, FileText, Activity } from 'lucide-react';
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

export default function ExaminerDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'respondents', 'results'

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

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Examiner Portal..." />;
  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Examiner Portal</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">CBT Management</p>
        </div>
        <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'tests' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FileText size={20} /> My tests
          </button>
          <button 
            onClick={() => setActiveTab('respondents')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'respondents' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users size={20} /> Respondents
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'results' ? 'bg-bsg-blue/10 text-bsg-blue' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Database size={20} /> Results database
          </button>
          <hr className="my-2 border-gray-100" />
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all">
            <Settings size={20} /> My account
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all">
            <HelpCircle size={20} /> Help
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden">
        {activeTab === 'tests' && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto">
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
          <div className="p-6 md:p-10 max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Respondents Monitoring</h2>
            <p className="text-gray-500">Live monitoring will appear here when exams are active.</p>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Global Results Database</h2>
            <p className="text-gray-500">Select a specific test from "My tests" to view its detailed results table.</p>
          </div>
        )}
      </div>
    </div>
  );
}
