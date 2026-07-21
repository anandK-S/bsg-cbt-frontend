'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { UserCircle, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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

  if (loading || !_hasHydrated) return <LoadingScreen text="Loading your BSG Portal..." />;
  if (!isAuthenticated || user?.role !== 'Candidate') return null;

  return (
    <div className="min-h-screen bg-gray-50/50 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Profile Section */}
        <div className="bg-gradient-to-br from-bsg-blue to-bsg-blue-dark rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-10 text-white shadow-2xl flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 md:gap-8 relative overflow-hidden ring-1 ring-white/10">
        {/* Abstract background shapes */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-row items-center sm:items-start gap-3 sm:gap-6 relative z-10 text-left w-full">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-bsg-blue text-2xl md:text-3xl font-extrabold shadow-inner overflow-hidden border-2 sm:border-4 border-white/20">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; }} />
              ) : (
                <UserCircle size={48} className="text-gray-300 w-full h-full p-2" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1 sm:mb-2 line-clamp-1">{t('welcome')}, {user?.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-blue-100 font-medium">
              <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm backdrop-blur-sm shadow-sm border border-white/10 whitespace-nowrap">{t('id')}: {user?.bsgId}</span>
              {user?.district && <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm backdrop-blur-sm shadow-sm border border-white/10 whitespace-nowrap hidden sm:inline-block">{t('dist')}: {user.district}</span>}
              {user?.section && <span className="bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm backdrop-blur-sm shadow-sm border border-white/10 whitespace-nowrap">{user.section}</span>}
            </div>
          </div>
        </div>
        
        {/* Removed Edit Profile button as requested */}
      </div>

      {/* Available Exams Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <h2 className="text-2xl font-extrabold text-gray-900">{t('availableExams')}</h2>
            <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
              {availableExams.length} {t('new')}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder={t('searchExams')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none w-full sm:min-w-[220px] shadow-sm transition-all"
            />
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none flex-1 shadow-sm transition-all bg-white"
              >
                <option value="All">{t('allCategories')}</option>
                {Array.from(new Set(availableExams.map(e => e.category || 'General'))).map(c => (
                  <option key={c} value={c}>{c === 'General' ? t('general') : c}</option>
                ))}
              </select>
              <select 
                value={filterExaminer} 
                onChange={(e) => setFilterExaminer(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-bsg-blue focus:outline-none flex-1 shadow-sm transition-all bg-white"
              >
                <option value="All">{t('allExaminers')}</option>
                {Array.from(new Set(availableExams.map(e => e.creatorName || 'Unknown Examiner'))).map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {availableExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('youreAllCaughtUp')}</h3>
            <p className="text-gray-500">{t('noNewExams')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableExams
              .filter(exam => filterCategory === 'All' || (exam.category || 'General') === filterCategory)
              .filter(exam => filterExaminer === 'All' || (exam.creatorName || 'Unknown Examiner') === filterExaminer)
              .filter(exam => exam.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((exam: Exam) => (
              <div key={exam._id} className="glass-card rounded-3xl overflow-hidden flex flex-col transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-[fade-in_0.5s_ease-out] group">
                <div className="p-5 md:p-6 flex-1 flex flex-col bg-white/40">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-bsg-gold/20 text-yellow-800 text-xs font-extrabold uppercase tracking-wider rounded-full shadow-sm">
                      {(exam.category === 'General' || !exam.category) ? t('general') : exam.category}
                    </span>
                    <span className="flex items-center text-gray-500 text-xs font-bold bg-gray-100 border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                      ⏱️ {exam.durationMinutes} {t('mins')}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-bsg-blue transition-colors">{exam.title}</h3>
                  <p className="text-gray-500 text-xs md:text-sm mb-4 line-clamp-2 flex-grow">{exam.description || t('noDescription')}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-500 font-medium">{t('createdBy')}</p>
                      <p className="text-xs font-bold text-gray-700">{exam.creatorName || t('unknownExaminer')}</p>
                    </div>
                    {exam.scheduledStartDate ? (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-bsg-blue-light font-medium">{t('scheduledFor')}</p>
                        <p className="text-xs font-bold text-bsg-blue">{new Date(exam.scheduledStartDate).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 font-medium">{t('published')}</p>
                        <p className="text-xs font-bold text-gray-600">{new Date(exam.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t border-gray-100">
                    <span className="font-semibold text-gray-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bsg-blue"></span> {exam.questionCount || 0} {t('qs')}</span>
                    <span className="font-semibold text-gray-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bsg-gold"></span> {exam.maxScore || 0} {t('marks')}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col justify-end">
                  {(() => {
                    const now = Date.now();
                    const hasEnded = exam.scheduledEndDate && new Date(exam.scheduledEndDate).getTime() < now;
                    const hasNotStarted = exam.scheduledStartDate && new Date(exam.scheduledStartDate).getTime() > now;

                    if (hasEnded) {
                      return (
                        <div className="w-full text-center px-4 py-3.5 border border-transparent text-sm font-bold rounded-xl text-red-700 bg-red-100/80 cursor-not-allowed">
                          {t('testIsClosed')}
                        </div>
                      );
                    }
                    if (hasNotStarted) {
                      return (
                        <Link 
                          href={`/exams/${exam._id}/start`} 
                          className="w-full flex justify-center items-center px-4 py-3.5 border border-transparent text-sm font-bold rounded-xl text-bsg-blue-dark bg-bsg-blue/10 hover:bg-bsg-blue/20 hover:shadow-lg transition-all"
                        >
                          {t('startsSoon')} &rarr;
                        </Link>
                      );
                    }
                    return (
                      <Link 
                        href={`/exams/${exam._id}/start`} 
                        className="w-full flex justify-center items-center px-4 py-3.5 border border-transparent text-sm font-bold rounded-xl text-bsg-blue-dark bg-bsg-gold hover:bg-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        {t('startExamNow')} &rarr;
                      </Link>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
