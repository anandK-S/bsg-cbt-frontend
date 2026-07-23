'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { Filter } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface PastResult {
  _id: string;
  totalMarks: number;
  score: number;
  createdAt: string;
  examId?: {
    _id: string;
    title: string;
    issueCertificate?: boolean;
  };
  violationReason?: string;
}

export default function PastResultsPage() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [pastExams, setPastExams] = useState<PastResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterExaminer, setFilterExaminer] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
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
          const resultsRes = await axios.get(`${API_URL}/api/attempts/results/me`, { withCredentials: true });
          // Sort past results by date descending
          const sortedResults = resultsRes.data.sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setPastExams(sortedResults);
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            logout();
            router.push('/login');
          } else {
            console.error('Error fetching past results:', error);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchCandidateData();
    }
  }, [_hasHydrated, isAuthenticated, user, router, logout]);

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Past Results..." />;
  if (!isAuthenticated || user?.role !== 'Candidate') return null;

  
  // Derived state for filtering
  const examiners = Array.from(new Set(pastExams.map(r => (r.examId as any)?.creatorId?.name || 'Unknown')));
  const filteredExams = pastExams.filter((result: any) => {
    const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
    const isPassed = percentage >= 50;
    const examiner = (result.examId as any)?.creatorId?.name || 'Unknown';
    
    // Status Filter
    if (filterStatus === 'Passed' && (!isPassed || result.violationReason)) return false;
    if (filterStatus === 'Failed' && (isPassed && !result.violationReason)) return false;
    if (filterStatus === 'Disqualified' && !result.violationReason) return false;
    
    // Examiner Filter
    if (filterExaminer !== 'All' && examiner !== filterExaminer) return false;
    
    // Date Filter
    if (filterDate) {
      const resultDate = new Date(result.createdAt).toISOString().split('T')[0];
      if (resultDate !== filterDate) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          {/* Abstract background shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t('pastResults')}</h1>
            <p className="text-blue-100 font-medium">{t('pastResultsDesc')}</p>
          </div>
        </div>

      {pastExams.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 ring-1 ring-black/5">
          <div className="flex items-center gap-2 text-bsg-blue-dark font-bold mb-3">
            <Filter size={18} /> {t('filters')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('status')}</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-bsg-blue outline-none bg-white"
              >
                <option value="All">{t('allResults')}</option>
                <option value="Passed">{t('passedOnly')}</option>
                <option value="Failed">{t('failedOnly')}</option>
                <option value="Disqualified">{t('disqualifiedOnly')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('examiner')}</label>
              <select 
                value={filterExaminer}
                onChange={(e) => setFilterExaminer(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-bsg-blue outline-none bg-white"
              >
                <option value="All">{t('allExaminers')}</option>
                {examiners.map((ex: any) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('date')}</label>
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-bsg-blue outline-none bg-white"
              />
            </div>
            {(filterStatus !== 'All' || filterExaminer !== 'All' || filterDate !== '') && (
              <div className="col-span-2 sm:col-span-3 flex justify-end">
                <button 
                  onClick={() => { setFilterStatus('All'); setFilterExaminer('All'); setFilterDate(''); }}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 underline"
                >
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
          <span className="text-6xl mb-4">📊</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noResultsYet')}</h3>
          <p className="font-medium text-gray-500">{t('noResultsDesc')}</p>
          <Link href="/dashboard" className="mt-6 px-6 py-3 bg-bsg-gold text-bsg-blue-dark font-bold rounded-xl hover:bg-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            {t('goToDashboard')}
          </Link>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden ring-1 ring-black/5">
          <div className="p-6 space-y-4">
            {filteredExams.map((result: PastResult & { attemptId?: any }) => {
              const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
              const isPassed = percentage >= 50;
              
              // Calculate time taken
              let timeTakenStr = 'N/A';
              if (result.attemptId) {
                const totalSeconds = (result.examId as any)?.durationMinutes * 60 + ((result.examId as any)?.durationSeconds || 0);
                const timeRemaining = result.attemptId.timeRemaining;
                if (totalSeconds > 0 && timeRemaining !== undefined) {
                  const takenSeconds = totalSeconds - timeRemaining;
                  const m = Math.floor(takenSeconds / 60);
                  const s = takenSeconds % 60;
                  timeTakenStr = `${m}m ${s}s`;
                }
              }

              const isPending = result.isReleased === false;

              return (
                <div key={result._id} className={`bg-gray-50 p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${result.violationReason ? 'border-red-300 bg-red-50/50' : 'border-gray-100 hover:bg-white hover:shadow-md hover:border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shrink-0 border-4 ${result.violationReason ? 'bg-red-100 text-red-600 border-red-200' : isPending ? 'bg-gray-100 text-gray-500 border-gray-200 text-sm' : isPassed ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {result.violationReason ? '!' : isPending ? '⏳' : `${percentage}%`}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{result.examId?.title || t('unknownExam')}</h4>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {t('date')}: {new Date(result.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {t('examiner')}: {(result.examId as any)?.creatorId?.name || t('unknownExaminer')} | {t('timeTaken')}: {timeTakenStr}
                      </p>
                      {result.violationReason && (
                        <p className="text-sm font-bold text-red-600 mt-2 bg-red-100 px-3 py-1 rounded inline-block">
                          {t('disqualified')}: {result.violationReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
                    <span className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm ${result.violationReason ? 'bg-red-600 text-white border border-red-700' : isPending ? 'bg-gray-100 text-gray-600 border border-gray-300' : isPassed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {result.violationReason ? t('disqualified') : isPending ? 'Results Pending' : isPassed ? t('passed') : t('failed')}
                    </span>
                    {!isPending && isPassed && !result.violationReason && (result.examId as any)?.issueCertificate !== false && (
                      <Link href={`/certificate/${result._id}`} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-bsg-gold text-bsg-blue-dark font-bold text-sm rounded-xl transition-all hover:bg-yellow-500 hover:shadow-md hover:-translate-y-0.5 shadow-sm">
                        {t('downloadCertificate')}
                      </Link>
                    )}
                    {!isPending && (
                      <Link href={`/exams/${result._id}/review`} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-bsg-blue font-bold text-sm rounded-lg transition-colors border border-gray-200 shadow-sm">
                        {t('viewFeedback')}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
