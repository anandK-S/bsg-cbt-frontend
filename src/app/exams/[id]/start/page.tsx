'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, Target, FileText, ChevronRight, ShieldCheck } from 'lucide-react';

export default function ExamStartPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Candidate') {
      router.push('/');
      return;
    }

    const fetchExamDetails = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/exams/${examId}`, {
          withCredentials: true,
        });
        setExam(data);

        if (data.scheduledStartDate) {
          const startTime = new Date(data.scheduledStartDate).getTime();
          const now = Date.now();
          if (startTime > now) {
            setTimeUntilStart(Math.floor((startTime - now) / 1000));
          }
        }
      } catch (error) {
        console.error('Error fetching exam:', error);
        setErrorMsg("Failed to load exam. It might have been unpublished or removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [isAuthenticated, user, router, examId]);

  useEffect(() => {
    if (timeUntilStart !== null && timeUntilStart > 0) {
      const timer = setInterval(() => {
        setTimeUntilStart((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0; // Trigger instructions reveal
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeUntilStart]);

  const handleStartExam = async () => {
    setStarting(true);
    setErrorMsg(null);
    try {
      const { data } = await axios.post(`${API_URL}/api/exams/${examId}/start`, {}, {
        withCredentials: true,
      });
      router.push(`/exams/${examId}/take`);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('An unexpected error occurred while trying to start the exam.');
      }
      setStarting(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bsg-blue mb-4"></div>
      <p className="text-gray-500 font-medium">Loading Assessment Details...</p>
    </div>
  );

  // If exam is strictly closed (we could also rely on backend)
  if (exam?.scheduledEndDate && new Date(exam.scheduledEndDate).getTime() < Date.now()) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="mb-6">
          <Link href="/dashboard" className="text-bsg-blue hover:text-blue-800 text-sm font-semibold transition-colors flex items-center justify-center gap-1">
            &larr; Return to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <AlertTriangle size={64} className="text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Test is Closed</h1>
          <p className="text-gray-500 font-medium">This examination ended on {new Date(exam.scheduledEndDate).toLocaleString()} and is no longer available.</p>
        </div>
      </div>
    );
  }

  // Countdown State
  if (timeUntilStart !== null && timeUntilStart > 0) {
    const days = Math.floor(timeUntilStart / (3600 * 24));
    const hours = Math.floor((timeUntilStart % (3600 * 24)) / 3600);
    const minutes = Math.floor((timeUntilStart % 3600) / 60);
    const seconds = timeUntilStart % 60;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <div className="mb-8">
          <Link href="/dashboard" className="text-bsg-blue hover:text-blue-800 text-sm font-semibold transition-colors flex items-center justify-center gap-1">
            &larr; Return to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 w-full max-w-2xl transform transition-all hover:scale-105 duration-300">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-bsg-blue animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {exam?.title}
          </h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">
            This examination is scheduled to start soon. Please wait here.
          </p>
          
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {days > 0 && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner">
                  {days.toString().padStart(2, '0')}
                </div>
                <span className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-2">Days</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner">
                {hours.toString().padStart(2, '0')}
              </div>
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-2">Hours</span>
            </div>
            <div className="text-3xl font-bold text-gray-400 mb-6">:</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner">
                {minutes.toString().padStart(2, '0')}
              </div>
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider mt-2">Minutes</span>
            </div>
            <div className="text-3xl font-bold text-gray-400 mb-6">:</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bsg-blue text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner border-2 border-blue-400">
                {seconds.toString().padStart(2, '0')}
              </div>
              <span className="text-bsg-blue font-bold text-xs uppercase tracking-wider mt-2">Seconds</span>
            </div>
          </div>
          
          <p className="mt-10 text-sm font-semibold text-gray-400">
            You will be automatically redirected to the instructions page when the timer hits zero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/dashboard" className="text-bsg-blue hover:text-blue-800 text-sm font-semibold transition-colors flex items-center gap-1">
          &larr; Return to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                {exam?.title || 'Assessment'}
              </h1>
              <p className="text-gray-500 font-medium">
                {exam?.description || 'Please carefully review the instructions before proceeding.'}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="mx-8 mt-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-bold text-sm">Cannot Start Examination</h3>
              <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Instructions & Details */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-bsg-blue" /> Examination Instructions
          </h2>

          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-50 text-bsg-blue p-1 rounded-full"><Clock size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">Duration Limit</p>
                <p className="text-sm text-gray-600 mt-1">You will have exactly <strong>{exam?.durationMinutes || 0} minutes</strong> to complete this assessment. The timer will begin immediately after you click start.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-yellow-50 text-yellow-600 p-1 rounded-full"><Target size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">Fullscreen & Proctoring</p>
                <p className="text-sm text-gray-600 mt-1">The exam will automatically enter fullscreen mode once started. Exiting fullscreen will trigger a security warning.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-50 text-green-600 p-1 rounded-full"><ShieldCheck size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">Academic Integrity</p>
                <p className="text-sm text-gray-600 mt-1">Any attempt to use unfair means, switch tabs, minimize the browser, or exit fullscreen will be automatically recorded as a security violation. Multiple violations will lead to immediate auto-submission of the exam.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-50 text-bsg-blue p-1 rounded-full"><FileText size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">Bilingual Questions</p>
                <p className="text-sm text-gray-600 mt-1">For bilingual questions, the English version will prevail in case of any discrepancy.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 text-bsg-blue bg-white border-gray-300 rounded focus:ring-bsg-blue"
              />
            </div>
            <label htmlFor="agree" className="text-sm font-medium text-gray-800 cursor-pointer select-none">
              I understand that any attempt to use unfair means will result in immediate disqualification, and I agree to follow all examination rules.
            </label>
          </div>

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <button
              onClick={handleStartExam}
              disabled={starting || !!errorMsg || !agreed}
              className="inline-flex items-center gap-2 px-8 py-3 bg-bsg-blue hover:bg-blue-800 text-white font-bold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {starting ? 'Initializing...' : 'I understand, start exam'}
              {!starting && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
