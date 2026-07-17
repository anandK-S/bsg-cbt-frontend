'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { RefreshCw, ShieldAlert, Clock, User, AlertTriangle, PlayCircle, StopCircle, RefreshCcw } from 'lucide-react';

export default function LiveMonitor() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [candidates, setCandidates] = useState<{ [key: string]: any }>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }

    // Fetch initial state
    const fetchLiveAttempts = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/attempts/live`, { withCredentials: true });
        const attemptsMap: { [key: string]: any } = {};
        data.forEach((attempt: any) => {
          attemptsMap[attempt.candidateId._id] = {
            candidateId: attempt.candidateId._id,
            name: attempt.candidateId.name,
            bsgId: attempt.candidateId.bsgId,
            district: attempt.candidateId.district,
            examId: attempt.examId.title || attempt.examId._id,
            status: attempt.status === 'In-Progress' ? 'Active' : attempt.status,
            warnings: attempt.warnings || 0,
            lastUpdate: attempt.updatedAt,
          };
        });
        setCandidates(attemptsMap);
      } catch (err) {
        console.error("Failed to fetch live attempts", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLiveAttempts();

    const newSocket = io(API_URL, {
      withCredentials: true,
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-monitor-room'); // Admin/Examiner subscribes
    });

    newSocket.on('candidate-status', (data) => {
      setCandidates(prev => ({
        ...prev,
        [data.candidateId]: { ...data, lastUpdate: new Date() }
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, router]);

  const forcePause = (candidateId: string) => {
    if (confirm("Are you sure you want to cancel this candidate's exam? This cannot be undone.")) {
      if (socket) {
        socket.emit('force-pause', { candidateId });
      }
    }
  };

  const cancelAllExams = () => {
    if (confirm("Are you sure you want to cancel ALL active exams? This cannot be undone.")) {
      if (socket) {
        Object.keys(candidates).forEach((cid) => {
          if (candidates[cid].status === 'Active' || candidates[cid].status === 'In-Progress') {
            socket.emit('force-pause', { candidateId: cid });
          }
        });
      }
    }
  };

  // Run a timer to periodically force re-render for offline detection
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-gray-50/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            Live Monitoring
          </h1>
          <p className="text-gray-500 font-medium mt-1">Real-time candidate activity and exam integrity tracking</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
            <User size={16} className="text-bsg-blue" />
            <span className="font-black text-bsg-blue">{Object.keys(candidates).length} Active</span>
          </div>
          
          <button 
            onClick={cancelAllExams}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
          >
            Cancel All Active
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-bsg-blue hover:bg-blue-50 rounded-xl transition-all"
            title="Refresh Connection"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="animate-spin text-bsg-blue mb-4" size={32} />
          <p className="text-gray-500 font-bold">Connecting to live feed...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(candidates).map((c: any) => {
            const timeSinceLastUpdate = now - new Date(c.lastUpdate).getTime();
            const isOffline = timeSinceLastUpdate > 20000 && (c.status === 'Active' || c.status === 'In-Progress');
            const displayStatus = isOffline ? 'Offline' : (c.status === 'In-Progress' ? 'Active' : c.status);
            
            let statusColor = 'bg-green-500';
            if (c.status === 'Blocked' || c.status === 'Completed') statusColor = 'bg-gray-400';
            if (isOffline) statusColor = 'bg-orange-500';
            if (c.status === 'Blocked') statusColor = 'bg-red-500';

            return (
            <div key={c.candidateId} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow relative">
              <div className={`h-2 w-full ${statusColor}`}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{c.name || `Candidate ${c.candidateId.substring(0,6)}`}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">ID: <span className="font-bold">{c.bsgId || c.candidateId.substring(0,8)}</span></p>
                    {c.district && <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.district}</p>}
                  </div>
                  <div className={`p-2 rounded-xl ${displayStatus === 'Blocked' ? 'bg-red-50 text-red-600' : displayStatus === 'Offline' ? 'bg-orange-50 text-orange-600' : displayStatus === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'}`}>
                    {displayStatus === 'Blocked' ? <ShieldAlert size={20} /> : displayStatus === 'Offline' ? <AlertTriangle size={20} /> : displayStatus === 'Completed' ? <StopCircle size={20} /> : <PlayCircle size={20} />}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                      Status
                    </span>
                    <span className={`text-sm font-black ${displayStatus === 'Blocked' ? 'text-red-600' : displayStatus === 'Offline' ? 'text-orange-600' : displayStatus === 'Completed' ? 'text-gray-600' : 'text-green-600'}`}>
                      {displayStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                      <AlertTriangle size={14} className={c.warnings > 0 ? 'text-yellow-500' : 'text-gray-400'} />
                      Warnings
                    </span>
                    <span className={`text-sm font-black px-2 py-0.5 rounded-md ${c.warnings >= 3 ? 'bg-red-100 text-red-700' : c.warnings > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                      {c.warnings} / 3
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                      <Clock size={14} />
                      Last Ping
                    </span>
                    <span className={`text-sm font-black ${isOffline ? 'text-orange-600' : 'text-gray-700'}`}>
                      {new Date(c.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => forcePause(c.candidateId)}
                    disabled={c.status === 'Blocked' || c.status === 'Completed'}
                    className="flex-1 bg-red-50 text-red-600 font-black py-2.5 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:hover:bg-red-50 border border-red-100"
                  >
                    Cancel Exam
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          
          {Object.keys(candidates).length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center px-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No active candidates</h3>
              <p className="text-gray-500 max-w-md">Waiting for candidates to join the exam or send live status updates. Their sessions will appear here automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
