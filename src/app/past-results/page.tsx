'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface PastResult {
  _id: string;
  totalMarks: number;
  score: number;
  createdAt: string;
  examId?: {
    _id: string;
    title: string;
  };
}

export default function PastResultsPage() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  
  const [pastExams, setPastExams] = useState<PastResult[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Past Results</h1>
        <p className="text-gray-500 font-medium">Review your completed examinations and feedback.</p>
      </div>

      {pastExams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
          <span className="text-6xl mb-4">📊</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Yet</h3>
          <p className="font-medium text-gray-500">You haven&apos;t completed any exams. Check your dashboard for available exams.</p>
          <Link href="/dashboard" className="mt-6 px-6 py-3 bg-bsg-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-4">
            {pastExams.map((result: PastResult) => {
              const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
              const isPassed = percentage >= 50;

              return (
                <div key={result._id} className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shrink-0 border-4 ${isPassed ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      {percentage}%
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{result.examId?.title || 'Unknown Exam'}</h4>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {new Date(result.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 md:mt-0">
                    <span className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm ${isPassed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {isPassed ? 'PASSED' : 'FAILED'}
                    </span>
                    <Link href={`/exams/${result._id}/review`} className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-bsg-blue font-bold text-sm rounded-lg transition-colors border border-gray-200 shadow-sm">
                      View Feedback
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
