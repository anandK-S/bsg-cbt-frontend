'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, Target, FileText, ChevronRight } from 'lucide-react';

export default function ExamStartPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Error fetching exam:', error);
        setErrorMsg("Failed to load exam. It might have been unpublished or removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [isAuthenticated, user, router, examId]);

  const handleStartExam = async () => {
    setStarting(true);
    setErrorMsg(null);
    try {
      // The API call to actually start and create the attempt happens on the /take page
      // But we can test it here if we want to catch the 403 before redirecting.
      // Wait, the original code just redirects to /take.
      // If we redirect to /take, the /take page handles the API call and throws the alert.
      // Let's change the architecture: we make the /start API call HERE, and if successful, redirect to /take.
      const { data } = await axios.post(`${API_URL}/api/exams/${examId}/start`, {}, {
        withCredentials: true,
      });
      // Assuming it succeeded, we redirect to take where it will fetch the active attempt
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
                <p className="text-sm font-bold text-gray-800">Passing Criteria</p>
                <p className="text-sm text-gray-600 mt-1">
                  This examination contains <strong>{exam?.questions?.length || 0} questions</strong>. You must score at least <strong>{
                    exam?.questions?.length 
                      ? Math.round(((exam?.passingMarks || 0) / exam.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0)) * 100) 
                      : (exam?.passingMarks || 0)
                  }%</strong> to successfully pass.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-50 text-green-600 p-1 rounded-full"><ShieldCheck size={16} /></div>
              <div>
                <p className="text-sm font-bold text-gray-800">Academic Integrity</p>
                <p className="text-sm text-gray-600 mt-1">This is a proctored examination environment. Leaving the fullscreen window, switching tabs, or copying text will be recorded as a warning. Multiple warnings will lead to automatic submission and disqualification.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <button
              onClick={handleStartExam}
              disabled={starting || !!errorMsg}
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

// Inline fallback for icon if ShieldCheck wasn't imported properly from lucide
function ShieldCheck(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
