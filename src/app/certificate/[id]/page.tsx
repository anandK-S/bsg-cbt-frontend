'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Download, Printer, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Available</h2>
          <p className="text-gray-500 mb-6">Certificates are only issued for successfully passed examinations.</p>
          <Link href="/past-results" className="block w-full bg-bsg-blue text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors">
            Return to Results
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date(result.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto mb-6 print:hidden flex justify-between items-center">
        <Link href="/past-results" className="text-bsg-blue hover:text-blue-800 flex items-center gap-2 font-semibold transition-colors">
          <ArrowLeft size={18} /> Back to Results
        </Link>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-bsg-blue hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95"
        >
          <Printer size={18} /> Print / Save as PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white border-[12px] border-bsg-blue p-8 sm:p-12 md:p-16 relative shadow-2xl print:shadow-none print:border-[8px] print:m-0 aspect-[1.414/1] flex flex-col justify-center text-center overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-b-[8px] border-r-[8px] border-bsg-blue rounded-br-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-t-[8px] border-l-[8px] border-bsg-blue rounded-tl-3xl opacity-20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-b-[8px] border-l-[8px] border-bsg-blue rounded-bl-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-t-[8px] border-r-[8px] border-bsg-blue rounded-tr-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col h-full justify-between py-4">
          <div>
            <div className="flex justify-center mb-6">
              <img src="/bsg-logo.png" alt="BSG Logo" className="h-24 w-auto object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-bsg-blue uppercase tracking-widest mb-2 font-serif">
              Certificate of Achievement
            </h1>
            <p className="text-gray-500 font-semibold tracking-widest uppercase text-sm md:text-base mt-4 mb-8">
              This acknowledges that
            </p>
            
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 border-b-2 border-gray-300 inline-block px-12 pb-2 mb-8 capitalize italic font-serif">
              {user?.name || 'Candidate Name'}
            </h2>
            
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
              has successfully completed the <strong className="text-gray-900">{result.examId?.title || 'Examination'}</strong> with a score of <strong className="text-gray-900">{percentage}%</strong>, demonstrating proficiency and dedication to the core values of the Bharat Scouts and Guides.
            </p>
          </div>

          <div className="flex justify-between items-end px-8 md:px-16 mt-auto">
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-2 font-bold text-gray-800 text-lg pb-1">{currentDate}</div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Date of Issue</p>
            </div>
            
            <div className="w-24 h-24 border-4 border-bsg-blue rounded-full flex items-center justify-center rotate-12 opacity-80 shrink-0">
              <div className="text-center">
                <span className="block text-xs font-black text-bsg-blue">VERIFIED</span>
                <span className="block text-xl font-black text-bsg-blue">BSG</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-2 font-bold text-gray-800 text-lg pb-1">Director</div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
