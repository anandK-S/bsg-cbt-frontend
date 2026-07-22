'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { API_URL } from '@/utils/apiConfig';
import '@/utils/apiConfig';
import { Settings, ListChecks, BarChart2, Users, FileText, ArrowLeft } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface ExamDetailsData {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  durationSeconds?: number;
  durationUnit: string;
  passingMarks: number;
  allowMultipleAttempts?: boolean;
  releaseResultsInstantly?: boolean;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  testKey?: string;
  status: string;
  category?: string;
  questions: any[];
}

interface ResultData {
  _id: string;
  totalMarks: number;
  score: number;
  createdAt: string;
  candidateId?: {
    name: string;
    bsgId: string;
  };
}

export default function AdminExamDetails() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<ExamDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'results' | 'stats'>('questions');
  
  const [results, setResults] = useState<ResultData[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchExam = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/exams/${examId}?t=${new Date().getTime()}`, {
        withCredentials: true,
      });
      setExam(data);
    } catch (error) {
      console.error('Error fetching exam:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'Admin') {
      router.push('/');
      return;
    }
    fetchExam();
  }, [isAuthenticated, user, router, examId, _hasHydrated]);

  useEffect(() => {
    if (activeTab === 'results' || activeTab === 'stats') {
      const fetchResults = async () => {
        setLoadingResults(true);
        try {
          const { data } = await axios.get(`${API_URL}/api/attempts/${examId}/result`, {
            withCredentials: true,
          });
          setResults(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error fetching results:", error);
        } finally {
          setLoadingResults(false);
        }
      };
      fetchResults();
    }
  }, [activeTab, examId]);

  const handleExportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Candidate Name', 'BSG ID', 'Score', 'Total Marks', 'Date'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
        `"${r.candidateId?.name || 'Unknown'}"`,
        `"${r.candidateId?.bsgId || 'N/A'}"`,
        r.score,
        r.totalMarks,
        `"${new Date(r.createdAt).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exam?.title?.replace(/\s+/g, '_') || 'exam'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Exam Details..." />;
  if (!exam) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-50">
      
      {/* Top Header & Horizontal Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-bsg-blue hover:text-white transition-colors flex-shrink-0">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-bsg-blue bg-blue-100 uppercase rounded-full">Read Only View</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{exam.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${exam.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{exam.status}</span>
                  <span className="text-sm font-medium text-gray-500">{exam.questions.length} Questions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex space-x-8 overflow-x-auto custom-scrollbar mt-2">
            <button 
              onClick={() => setActiveTab('basic')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'basic' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <Settings size={18} /> Basic Settings
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'questions' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <ListChecks size={18} /> Questions
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'results' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <Users size={18} /> Results Table
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm ${activeTab === 'stats' ? 'border-bsg-blue text-bsg-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2`}
            >
              <BarChart2 size={18} /> Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* BASIC SETTINGS */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Exam Configuration</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-gray-900 font-medium">{exam.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-gray-900 font-bold">{exam.category || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-gray-900 font-bold">
                    {exam.durationMinutes ? `${exam.durationMinutes} mins` : ''} 
                    {exam.durationSeconds ? ` (${exam.durationSeconds} total seconds)` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</p>
                  <p className="text-gray-900 font-bold">{exam.scheduledStartDate ? new Date(exam.scheduledStartDate).toLocaleString() : 'Not scheduled'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</p>
                  <p className="text-gray-900 font-bold">{exam.scheduledEndDate ? new Date(exam.scheduledEndDate).toLocaleString() : 'Not scheduled'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Allow Multiple Attempts</p>
                  <p className="text-gray-900 font-bold">{exam.allowMultipleAttempts ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Release Results Instantly</p>
                  <p className="text-gray-900 font-bold">{exam.releaseResultsInstantly ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Test Key / Password</p>
                  <p className="text-gray-900 font-bold">{exam.testKey ? exam.testKey : <span className="text-gray-400 italic">None</span>}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="max-w-5xl">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Questions</h1>
            {exam.questions.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-16 text-center">
                <FileText size={40} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">No questions</h3>
                <p className="text-gray-500">This exam doesn't have any questions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exam.questions.map((q, idx) => (
                  <div key={q.questionId._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-start gap-4">
                      <span className="w-8 h-8 rounded-lg bg-bsg-blue/10 text-bsg-blue font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">{q.questionId.text}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-2 py-0.5 rounded-md">Type: {q.type || 'SingleChoice'}</span>
                          <span className="text-xs font-bold text-bsg-blue uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">Marks: {q.marks || 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.questionId.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 ${q.questionId.correctOptionIndex === optIdx ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${q.questionId.correctOptionIndex === optIdx ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {['A', 'B', 'C', 'D'][optIdx]}
                            </span>
                            <span className={`font-medium ${q.questionId.correctOptionIndex === optIdx ? 'text-green-900 font-bold' : 'text-gray-700'}`}>
                              {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                      {q.questionId.mediaUrl && (
                        <div className="mt-6 flex justify-center">
                          <img src={`${API_URL}${q.questionId.mediaUrl}`} alt="Question Media" className="max-h-48 max-w-full rounded-xl border border-gray-200 shadow-sm object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TABLE */}
        {activeTab === 'results' && (
          <div className="max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-3xl font-black text-gray-900">Results Database</h1>
              <button 
                onClick={handleExportToCSV}
                disabled={results.length === 0}
                className="bg-green-600 text-white font-black px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FileText size={18} /> Export to CSV
              </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Candidate Details</th>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-8 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loadingResults ? (
                      <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-500 font-medium">Loading results...</td></tr>
                    ) : results.length === 0 ? (
                      <tr><td colSpan={3} className="px-8 py-10 text-center text-gray-500 font-medium">No results found for this exam yet.</td></tr>
                    ) : (
                      results.map((result) => (
                        <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{result.candidateId?.name || 'Unknown Candidate'}</div>
                            <div className="text-xs text-gray-500 mt-1">{result.candidateId?.bsgId || 'No ID'}</div>
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-gray-900">{result.score}</span>
                              <span className="text-sm font-bold text-gray-400">/ {result.totalMarks}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                              <div className="bg-bsg-blue h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (result.score / result.totalMarks) * 100))}%` }}></div>
                            </div>
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {new Date(result.createdAt).toLocaleString()}
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

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-black text-gray-900 mb-6">Exam Statistics</h1>
            {results.length === 0 ? (
               <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-16 text-center">
                 <BarChart2 size={40} className="mx-auto text-gray-400 mb-4" />
                 <h3 className="text-xl font-black text-gray-900 mb-2">No data available</h3>
                 <p className="text-gray-500">Statistics will appear here once candidates start taking the exam.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Participants</p>
                  <p className="text-4xl font-black text-bsg-blue">{results.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Average Score</p>
                  <p className="text-4xl font-black text-emerald-500">
                    {Math.round((results.reduce((acc, r) => acc + r.score, 0) / results.length) * 10) / 10}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">out of {results[0]?.totalMarks || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Highest Score</p>
                  <p className="text-4xl font-black text-bsg-gold">
                    {Math.max(...results.map(r => r.score))}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
