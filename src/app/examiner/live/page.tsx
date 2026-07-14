'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/utils/apiConfig';

export default function LiveMonitor() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [candidates, setCandidates] = useState<{ [key: string]: any }>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }

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
    if (socket) {
      socket.emit('force-pause', { candidateId });
    }
  };

  if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-bsg-blue mb-6">Live Exam Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(candidates).map((c: any) => (
          <div key={c.candidateId} className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${c.status === 'Blocked' ? 'border-red-500' : 'border-green-500'}`}>
            <h3 className="text-lg font-bold text-gray-800">{c.name || `Candidate ${c.candidateId.substring(0,6)}`}</h3>
            <p className="text-sm text-gray-500 mt-1">Exam ID: {c.examId}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className={`text-sm font-bold ${c.status === 'Blocked' ? 'text-red-600' : 'text-green-600'}`}>{c.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Warnings:</span>
                <span className={`text-sm font-bold ${c.warnings >= 3 ? 'text-red-600' : 'text-yellow-600'}`}>{c.warnings} / 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Last Ping:</span>
                <span className="text-sm text-gray-700">{new Date(c.lastUpdate).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => forcePause(c.candidateId)}
                className="flex-1 bg-red-100 text-red-700 py-2 rounded font-medium hover:bg-red-200"
              >
                Force Pause
              </button>
            </div>
          </div>
        ))}
        
        {Object.keys(candidates).length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
            Waiting for candidates to join or send updates...
          </div>
        )}
      </div>
    </div>
  );
}
