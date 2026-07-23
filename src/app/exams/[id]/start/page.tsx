'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, Target, FileText, ChevronRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExamStartPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [enteredKey, setEnteredKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

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
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(err => console.log(err));
      }

      const { data } = await axios.post(`${API_URL}/api/exams/${examId}/start`, { testKey: enteredKey }, {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-bsg-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (errorMsg && !exam) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-8">{errorMsg}</p>
      <Link href="/dashboard" className="bg-bsg-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-bsg-blue-dark transition-colors">
        Return to Dashboard
      </Link>
    </div>
  );

  if (exam?.alreadyAttempted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-sm border border-red-100 p-8 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Attempt Already Completed</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            You have already completed this exam, and multiple attempts are not allowed by the examiner. If you believe this is a mistake, please contact your examiner.
          </p>
          <Link href="/dashboard" className="block w-full bg-bsg-blue text-white px-6 py-4 rounded-xl font-bold hover:bg-bsg-blue-dark transition-colors shadow-sm">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date().getTime();
  const endTime = exam?.scheduledEndDate ? new Date(exam.scheduledEndDate).getTime() : null;
  if (endTime && endTime < now) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white max-w-lg w-full rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Exam Expired</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            This exam was scheduled to end on {new Date(exam.scheduledEndDate).toLocaleString()} and is no longer accessible.
          </p>
          <Link href="/dashboard" className="block w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-sm">
            Return to Dashboard
          </Link>
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

  const handleVerifyKey = async () => {
    if (!enteredKey.trim()) return;
    setVerifyingKey(true);
    setKeyError(null);
    try {
      await axios.post(`${API_URL}/api/exams/${examId}/verify-key`, { testKey: enteredKey }, {
        withCredentials: true,
      });
      setIsUnlocked(true);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setKeyError(err.response.data.message || t('invalidTestKey') || 'Invalid test key');
      } else {
        setKeyError(t('failedToVerifyKey') || 'Failed to verify key. Please try again.');
      }
    } finally {
      setVerifyingKey(false);
    }
  };

  // If exam has a test key and it hasn't been unlocked yet
  if (exam?.hasTestKey && !isUnlocked) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t('restrictedAccess') || 'Restricted Access'}</h2>
          <p className="text-gray-500 font-medium mb-8">{t('testKeyRequiredDesc') || 'This examination requires a test key or password to proceed. Please enter it below.'}</p>
          
          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="testKey" className="block text-sm font-bold text-gray-700 mb-1.5">{t('testKeyOrPassword') || 'Test Key / Password'}</label>
              <input
                id="testKey"
                type="password"
                value={enteredKey}
                onChange={(e) => setEnteredKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyKey()}
                placeholder={t('enterPassword') || 'Enter password'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all font-medium text-sm text-gray-900 outline-none"
              />
            </div>
            {keyError && (
              <p className="text-red-500 text-sm font-bold bg-red-50 p-2.5 rounded-lg border border-red-100">{keyError}</p>
            )}
            <button
              onClick={handleVerifyKey}
              disabled={verifyingKey || !enteredKey.trim()}
              className="w-full py-3 bg-bsg-blue hover:bg-bsg-blue-dark text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyingKey ? 'Verifying...' : (t('unlockExamination') || 'Unlock Examination')}
            </button>
          </div>
          <div className="mt-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors">
              Cancel and return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 relative py-12 px-4 sm:px-6">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm font-semibold transition-colors flex items-center gap-1">
          &larr; Return to Dashboard
        </Link>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden ring-1 ring-black/5">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-bsg-blue to-bsg-blue-dark p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-bsg-gold opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {exam?.title || 'Assessment'}
            </h1>
            <p className="text-blue-100 font-medium text-sm sm:text-base">
              {exam?.description || 'Please carefully review the instructions before proceeding.'}
            </p>
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
            <FileText size={20} className="text-bsg-blue" /> {t('examInstructions') || 'Examination Instructions'}
          </h2>

          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-50 text-bsg-blue p-1 rounded-full"><Clock size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">{t('durationLimit') || 'Duration Limit'}</p>
                <p className="text-sm text-gray-600 mt-1">{(t('durationLimitDesc') || 'You will have exactly {minutes} minutes to complete this assessment. The timer will begin immediately after you click start.').replace('{minutes}', String(exam?.durationMinutes || 0))}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-yellow-50 text-yellow-600 p-1 rounded-full"><Target size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">{t('fullscreenProctoring') || 'Fullscreen & Proctoring'}</p>
                <p className="text-sm text-gray-600 mt-1">{t('fullscreenProctoringDesc') || 'The exam will automatically enter fullscreen mode once started. Exiting fullscreen will trigger a security warning.'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-50 text-green-600 p-1 rounded-full"><ShieldCheck size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">{t('academicIntegrityTitle') || 'Academic Integrity'}</p>
                <p className="text-sm text-gray-600 mt-1">{t('academicIntegrityDesc') || 'Any attempt to use unfair means, switch tabs, minimize the browser, or exit fullscreen will be automatically recorded as a security violation. Multiple violations will lead to immediate auto-submission of the exam.'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-50 text-bsg-blue p-1 rounded-full"><FileText size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">{t('bilingualQuestionsTitle') || 'Bilingual Questions'}</p>
                <p className="text-sm text-gray-600 mt-1">{t('bilingualQuestionsDesc') || 'For bilingual questions, the English version will prevail in case of any discrepancy.'}</p>
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
              {t('understandRules') || 'I understand that any attempt to use unfair means will result in immediate disqualification, and I agree to follow all examination rules.'}
            </label>
          </div>

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <button
              onClick={handleStartExam}
              disabled={starting || !!errorMsg || !agreed}
              className="inline-flex items-center gap-2 px-8 py-3 bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {starting ? 'Initializing...' : (t('startExamBtn') || 'I understand, start exam')}
              {!starting && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
