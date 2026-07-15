'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function RespondentsPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'Examiner') {
      router.push('/');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated) return <LoadingScreen text="Loading..." />;
  if (!isAuthenticated || user?.role !== 'Examiner') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Respondents Monitoring</h1>
      
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm">
        <div className="text-6xl mb-4">👀</div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Live Monitoring</h3>
        <p className="text-gray-500 font-medium">Respondents Monitoring will appear here when exams are active.</p>
      </div>
    </div>
  );
}
