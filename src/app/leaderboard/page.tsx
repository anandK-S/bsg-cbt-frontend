'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface LeaderboardEntry {
  _id: string;
  name: string;
  bsgId: string;
  section: string;
  district?: string;
  totalScore: number;
  totalMarksPossible: number;
  examsTaken: number;
  percentage: string;
}

export default function LeaderboardPage() {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [exams, setExams] = useState<{_id: string, title: string}[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchLeaderboardAndExams = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (selectedExamId !== 'All') queryParams.append('examId', selectedExamId);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const [leaderboardRes, examsRes] = await Promise.all([
          axios.get(`${API_URL}/api/attempts/leaderboard?${queryParams.toString()}`, { withCredentials: true }),
          axios.get(`${API_URL}/api/exams/available`, { withCredentials: true })
        ]);
        setLeaderboard(leaderboardRes.data);
        
        // Only set exams if we haven't already or if we want to refresh
        if (exams.length === 0) {
          setExams(examsRes.data);
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout();
          router.push('/login');
        } else {
          console.error('Failed to fetch leaderboard data', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardAndExams();
  }, [_hasHydrated, isAuthenticated, router, logout, selectedExamId, startDate, endDate]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading Leaderboard..." />;
  if (!isAuthenticated) return null;

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-bsg-gold to-yellow-500 rounded-3xl p-8 mb-8 text-bsg-blue-dark shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-20 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full">
            <div>
              <h1 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
                🏆 Global Leaderboard
              </h1>
              <p className="text-blue-900 text-lg font-medium">Top performing scouts across all examinations.</p>
            </div>
            
            <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-3 bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-bsg-blue-dark font-bold text-sm whitespace-nowrap hidden sm:block">From:</label>
                <input 
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="bg-white text-bsg-blue-dark font-bold text-sm rounded-xl border-none focus:ring-2 focus:ring-white p-2.5 shadow-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-bsg-blue-dark font-bold text-sm whitespace-nowrap hidden sm:block">To:</label>
                <input 
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="bg-white text-bsg-blue-dark font-bold text-sm rounded-xl border-none focus:ring-2 focus:ring-white p-2.5 shadow-sm outline-none"
                />
              </div>
              <select
                id="examFilter"
                value={selectedExamId}
                onChange={(e) => { setSelectedExamId(e.target.value); setCurrentPage(1); }}
                className="bg-white text-bsg-blue-dark font-bold text-sm rounded-xl border-none focus:ring-2 focus:ring-white p-2.5 shadow-sm outline-none w-full sm:w-auto mt-2 sm:mt-0"
              >
                <option value="All">All Exams (Aggregate)</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>{exam.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-gray-100 mb-10 flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Candidate</th>
                    <th scope="col" className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Section</th>
                    <th scope="col" className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">District</th>
                    <th scope="col" className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Exams Taken</th>
                    <th scope="col" className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Total Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {currentItems.map((entry, index) => {
                    const actualRank = indexOfFirstItem + index;
                    const isTop3 = actualRank < 3;
                    const medals = ['🥇', '🥈', '🥉'];
                    
                    return (
                      <tr key={entry._id} className={`transition-colors group ${actualRank === 0 ? 'bg-yellow-50/50 hover:bg-yellow-100/50' : 'hover:bg-blue-50/50'}`}>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`text-xl font-black ${isTop3 ? '' : 'text-gray-500'}`}>
                            {isTop3 ? medals[actualRank] : `#${actualRank + 1}`}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={`text-sm font-black ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>{entry.name}</div>
                          <div className="text-xs font-medium text-gray-500">BSG ID: {entry.bsgId}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{entry.section || '-'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-200">{entry.district || '-'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-600">
                          {entry.examsTaken}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className={`text-lg font-black ${isTop3 ? 'text-bsg-gold' : 'text-bsg-blue'}`}>
                            {entry.totalScore}
                          </div>
                          <div className="text-xs font-bold text-gray-400">
                            ({entry.percentage}%)
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-auto shrink-0">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-bold">{indexOfFirstItem + 1}</span> to <span className="font-bold">{Math.min(indexOfLastItem, leaderboard.length)}</span> of <span className="font-bold">{leaderboard.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-500">No candidates have completed exams matching this filter.</p>
          </div>
        )}
      </div>
  );
}
