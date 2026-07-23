'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  PlayCircle, 
  StopCircle, 
  RefreshCcw, 
  ArrowLeft, 
  Wifi, 
  WifiOff, 
  RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LiveMonitor() {
  const { language, t } = useLanguage();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  
  const [candidates, setCandidates] = useState<{ [key: string]: any }>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Live Data (used for initial load and polling)
  const fetchLiveAttempts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/attempts/live?t=${Date.now()}`, { withCredentials: true });
      const attemptsMap: { [key: string]: any } = {};
      
      data.forEach((attempt: any) => {
        const candidateId = attempt.candidateId?._id || attempt.candidateId;
        attemptsMap[candidateId] = {
          candidateId,
          attemptId: attempt._id,
          name: attempt.candidateId?.name || 'Unknown Candidate',
          bsgId: attempt.candidateId?.bsgId,
          district: attempt.candidateId?.district,
          examTitle: attempt.examId?.title || 'Unknown Exam',
          status: attempt.status === 'In-Progress' ? 'Active' : attempt.status,
          warnings: attempt.warnings || 0,
          lastUpdate: attempt.updatedAt,
          examMaxTime: attempt.examMaxTime,
          timeRemaining: attempt.timeRemaining
        };
      });
      setCandidates(attemptsMap);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch live attempts", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial Auth Check & Polling Setup
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }

    fetchLiveAttempts();
    
    // Fallback polling for Vercel (every 3 seconds)
    const interval = setInterval(fetchLiveAttempts, 3000);
    return () => clearInterval(interval);
  }, [_hasHydrated, isAuthenticated, user, router, fetchLiveAttempts]);

  // Supabase Realtime Setup
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const channel = supabase.channel('monitor-room');
    setSocket(channel); // Storing channel in state variable socket for backwards compatibility

    channel
      .on('broadcast', { event: 'status-update' }, (payload: any) => {
        const data = payload.payload;
        setCandidates(prev => {
          const existing = prev[data.candidateId] || {};
          let newTime = data.timeRemaining;
          if (existing.examMaxTime && newTime > existing.examMaxTime) {
            newTime = existing.examMaxTime;
          }
          return {
            ...prev,
            [data.candidateId]: { 
              ...existing, 
              ...data, 
              timeRemaining: newTime,
              lastUpdate: new Date() 
            }
          };
        });
      })
      .on('broadcast', { event: 'join-exam' }, (payload: any) => {
        fetchLiveAttempts(); // Refresh if a new candidate joins
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, fetchLiveAttempts]);

  // Clock for detecting offline status
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  const cancelAttempt = async (candidateId: string, attemptId: string) => {
    if (confirm("Are you sure you want to cancel this candidate's attempt? This cannot be undone.")) {
      try {
        await axios.post(`${API_URL}/api/attempts/${attemptId}/cancel`, {}, { withCredentials: true });
        if (socket) {
          socket.send({ type: 'broadcast', event: 'force-pause', payload: { candidateId } }); 
        }
        setCandidates(prev => {
          const newMap = { ...prev };
          delete newMap[candidateId];
          return newMap;
        });
      } catch (err) {
        alert("Failed to cancel attempt. They might have already submitted.");
      }
    }
  };

  const cancelAllExams = async () => {
    if (confirm("Are you sure you want to cancel ALL active exams? This cannot be undone.")) {
      const activeAttempts = Object.values(candidates).filter(c => c.status === 'Active' || c.status === 'In-Progress');
      
      if (activeAttempts.length === 0) {
        alert("No active attempts to cancel.");
        return;
      }
      
      try {
        await Promise.all(activeAttempts.map(c => 
          axios.post(`${API_URL}/api/attempts/${c.attemptId}/cancel`, {}, { withCredentials: true })
        ));
        
        if (socket) {
          Object.keys(candidates).forEach((cid) => {
            if (candidates[cid].status === 'Active' || candidates[cid].status === 'In-Progress') {
              socket.send({ type: 'broadcast', event: 'force-pause', payload: { candidateId: cid } });
            }
          });
        }
        
        alert("All active attempts have been cancelled.");
        setCandidates({}); 
      } catch (err) {
        console.error(err);
        alert("Error occurred while cancelling some attempts.");
      }
    }
  };

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-bsg-blue mx-auto mb-4" size={36} />
        <p className="text-gray-600 font-bold text-lg">{t('connectingLiveFeed') || 'Connecting to live feed...'}</p>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  // Show EVERY candidate from the database, exactly mirroring Supabase without any filtering
  const candidateList = Object.values(candidates);
  const activeCount = candidateList.filter(c => c.status === 'Active' || c.status === 'In-Progress').length;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-bsg-blue to-bsg-blue-dark text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Link href="/examiner" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <h1 className="text-2xl font-extrabold tracking-tight">{t('liveMonitoringTitle') || 'Live Monitoring'}</h1>
                </div>
                <p className="text-blue-200 text-sm font-medium mt-0.5">{t('liveMonitoringDesc') || 'Real-time candidate activity tracking'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={cancelAllExams}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
              >
                {t('cancelAllActive') || 'Cancel All Active'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl md:text-3xl font-black">{candidateList.length}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-1">{t('liveSessions') || 'Live Sessions'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-green-300">{activeCount}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-1">{t('activeNow') || 'Active Now'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl md:text-3xl font-black text-yellow-300">{candidateList.filter(c => c.warnings > 0).length}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-1">{t('warnings') || 'Warnings'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wifi size={16} className="text-green-500" />
            {lastRefresh && (
              <span className="text-gray-500 text-sm font-medium flex items-center gap-1.5"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Auto-refreshing every 3s &middot; Last check: {lastRefresh.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={() => fetchLiveAttempts(true)}
            disabled={isRefreshing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            <RefreshCcw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {t('forceRefresh') || 'Force Refresh'}
          </button>
        </div>

        {candidateList.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">{t('noActiveCandidates') || 'No Active Candidates'}</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              {t('noActiveCandidatesDesc') || 'No candidates are currently taking your exams. Sessions appear here automatically once they start.'}
            </p>
            <button
              onClick={() => fetchLiveAttempts(true)}
              className="inline-flex items-center gap-2 bg-bsg-blue text-white font-bold px-6 py-2.5 rounded-xl hover:bg-bsg-blue-dark transition-colors"
            >
              <RefreshCcw size={16} /> {t('checkAgain') || 'Check Again'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {candidateList.map((c: any) => {
              const timeSinceUpdate = now - new Date(c.lastUpdate).getTime();
              const isOffline = timeSinceUpdate > 60000 && (c.status === 'Active' || c.status === 'In-Progress');
              
              let displayStatusEn = isOffline ? 'Offline' : (c.status === 'In-Progress' ? 'Active' : c.status);
              let displayStatusLocale = isOffline ? t('offline') || 'Offline' : (c.status === 'In-Progress' ? t('active') || 'Active' : (c.status === 'Blocked' ? t('blocked') || 'Blocked' : t('completed') || 'Completed'));

              let statusColor = 'bg-green-500';
              let statusTextColor = 'text-green-600';
              let statusBg = 'bg-green-50';
              
              if (isOffline) { statusColor = 'bg-orange-500'; statusTextColor = 'text-orange-600'; statusBg = 'bg-orange-50'; }
              if (c.status === 'Blocked') { statusColor = 'bg-red-500'; statusTextColor = 'text-red-600'; statusBg = 'bg-red-50'; }
              if (c.status === 'Submitted' || c.status === 'Auto-Submitted' || c.status === 'Completed') { statusColor = 'bg-gray-400'; statusTextColor = 'text-gray-600'; statusBg = 'bg-gray-50'; }

              return (
                <div key={c.candidateId} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
                  {/* Top Status line */}
                  <div className={`h-1.5 w-full ${statusColor}`}></div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="text-lg font-extrabold text-gray-900 truncate">{c.name}</h3>
                        <p className="text-sm text-gray-500 font-medium">BSG ID: {c.bsgId || '—'}</p>
                        {c.district && <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5 truncate">{c.district}</p>}
                      </div>
                      <div className={`${statusBg} p-2.5 rounded-xl flex-shrink-0`}>
                          {displayStatusEn === 'Blocked' ? <ShieldAlert size={22} className={statusTextColor} /> :
                          displayStatusEn === 'Offline' ? <AlertTriangle size={22} className={statusTextColor} /> :
                          (displayStatusEn === 'Submitted' || displayStatusEn === 'Auto-Submitted' || displayStatusEn === 'Completed') ? <StopCircle size={22} className={statusTextColor} /> :
                          <PlayCircle size={22} className={statusTextColor} />}
                      </div>
                    </div>
                    
                    <div className="px-4 mb-2">
                      {(() => {
                        const examMaxTime = (c.exams as any)?.duration_seconds || ((c.exams as any)?.duration_minutes * 60) || c.timeRemaining;
                        const progressPercent = examMaxTime > 0 ? Math.min(100, Math.max(0, ((examMaxTime - c.timeRemaining) / examMaxTime) * 100)) : 0;
                        return (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent > 80 ? 'bg-orange-500' : progressPercent > 90 ? 'bg-red-500' : 'bg-bsg-blue'}`} style={{ width: `${progressPercent}%` }}></div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="bg-blue-50/50 rounded-xl px-3 py-2.5 mb-4 text-xs font-bold text-bsg-blue truncate border border-blue-100">
                      📝 {c.examTitle}
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-3 mb-5 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                          {t('statusLive') || 'Status'}
                        </span>
                        <span className={`text-xs font-extrabold ${statusTextColor}`}>{displayStatusLocale}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                          <AlertTriangle size={12} className={c.warnings > 0 ? 'text-yellow-500' : 'text-gray-300'} />
                          {t('warnings') || 'Warnings'}
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${c.warnings >= 1 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                          {c.warnings} / 1
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                          <Clock size={12} />
                          {t('lastPing') || 'Last Ping'}
                        </span>
                        <span className={`text-xs font-extrabold ${isOffline ? 'text-orange-600' : 'text-gray-700'}`}>
                          {new Date(c.lastUpdate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => cancelAttempt(c.candidateId, c.attemptId)}
                        disabled={c.status === 'Blocked'}
                        className="w-full bg-white text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 disabled:hover:bg-white border-2 border-red-100 text-sm"
                      >
                        {t('cancelExam') || 'Cancel Exam'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
