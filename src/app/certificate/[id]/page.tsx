'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Printer, ArrowLeft, Award } from 'lucide-react';
import Link from 'next/link';

export default function CertificatePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchResult = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/attempts/results/${resultId}/detailed`, {
          withCredentials: true,
        });
        setResult(data.result);
      } catch (error) {
        console.error('Error fetching result:', error);
        alert('Failed to load certificate data.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [_hasHydrated, isAuthenticated, router, resultId]);

  if (loading || !_hasHydrated) return <LoadingScreen text="Generating Certificate..." />;
  if (!result) return null;

  const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
  if (percentage < 50 || result.violationReason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative p-4">
        <div className="absolute top-20 right-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg text-center max-w-md w-full border border-gray-100 ring-1 ring-black/5">
          <div className="w-20 h-20 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl font-bold shadow">
            ✕
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Certificate Not Available</h2>
          <p className="text-gray-500 mb-6">Certificates are only issued for successfully passed examinations.</p>
          <Link href="/past-results" className="block w-full bg-gradient-to-r from-bsg-blue to-bsg-blue-dark text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md">
            Return to Results
          </Link>
        </div>
      </div>
    );
  }

  const examTitle = result.examId?.title || 'Examination';

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${examTitle} - Certificate - ${user?.name}`;
    window.print();
    document.title = originalTitle;
  };

  const currentDate = new Date(result.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      {/* Top Actions Bar */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden flex justify-between items-center">
        <Link href="/past-results" className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-semibold transition-colors">
          <ArrowLeft size={18} /> Back to Results
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark px-6 py-2.5 rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Printer size={18} /> Download Certificate
        </button>
      </div>

      {/* Certificate */}
      <div className="max-w-4xl mx-auto bg-white relative shadow-2xl print:shadow-none print:m-0 overflow-hidden"
           style={{ border: '12px solid #1e3a5f', aspectRatio: '1.414/1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Corner ornaments */}
        <div className="absolute top-3 left-3 w-20 h-20 border-l-4 border-t-4 border-bsg-gold opacity-70 rounded-tl-lg"></div>
        <div className="absolute top-3 right-3 w-20 h-20 border-r-4 border-t-4 border-bsg-gold opacity-70 rounded-tr-lg"></div>
        <div className="absolute bottom-3 left-3 w-20 h-20 border-l-4 border-b-4 border-bsg-gold opacity-70 rounded-bl-lg"></div>
        <div className="absolute bottom-3 right-3 w-20 h-20 border-r-4 border-b-4 border-bsg-gold opacity-70 rounded-br-lg"></div>
        
        {/* Background watermark pattern */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <Award size={400} className="text-bsg-blue" />
        </div>

        {/* Gold stripe at top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-bsg-gold via-yellow-400 to-bsg-gold"></div>
        {/* Gold stripe at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-bsg-gold via-yellow-400 to-bsg-gold"></div>

        <div className="relative z-10 flex flex-col h-full justify-between py-6 sm:py-8 px-8 sm:px-14 text-center">
          
          {/* Header */}
          <div>
            <div className="flex justify-center mb-3">
              <img src="/bsg-logo.png" alt="BSG Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            
            <p className="text-gray-400 font-bold tracking-[0.3em] uppercase text-xs sm:text-sm mb-1">Bharat Scouts and Guides</p>
            <p className="text-gray-400 font-semibold tracking-widest uppercase text-xs mb-4">Computer Based Test Platform</p>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-bsg-gold to-transparent flex-1"></div>
              <Award size={24} className="text-bsg-gold" />
              <div className="h-px bg-gradient-to-r from-transparent via-bsg-gold to-transparent flex-1"></div>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-bsg-blue uppercase tracking-widest mb-1 font-serif">
              Certificate of Achievement
            </h1>
            <p className="text-gray-400 font-semibold tracking-widest uppercase text-xs sm:text-sm mt-3 mb-4">
              This is to certify that
            </p>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 inline-block px-8 pb-1 mb-4 capitalize italic font-serif" style={{ borderBottom: '2px solid #d4a017' }}>
              {user?.name || 'Candidate Name'}
            </h2>
            
            <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              has successfully completed the <strong className="text-gray-900">{examTitle}</strong> with a score of{' '}
              <strong className="text-bsg-blue">{percentage}%</strong>, demonstrating proficiency and dedication to the core values of the Bharat Scouts and Guides.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end px-4 sm:px-8 mt-auto pt-4">
            <div className="text-center">
              <div className="font-bold text-gray-700 text-sm sm:text-base pb-1 border-b-2 border-gray-400 min-w-[120px]">{currentDate}</div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Date of Issue</p>
            </div>
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-bsg-blue rounded-full flex items-center justify-center rotate-12 opacity-80 shrink-0">
              <div className="text-center">
                <span className="block text-[9px] sm:text-xs font-black text-bsg-blue">VERIFIED</span>
                <span className="block text-base sm:text-xl font-black text-bsg-blue">BSG</span>
              </div>
            </div>

            <div className="text-center">
              <div className="font-bold text-gray-700 text-sm sm:text-base pb-1 border-b-2 border-gray-400 min-w-[140px]">BSG CBT Platform</div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
