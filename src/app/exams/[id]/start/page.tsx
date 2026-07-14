'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function ExamStartPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Candidate') {
      router.push('/');
      return;
    }

    const fetchExamDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/exams/${examId}`, {
          withCredentials: true,
        });
        setExam(data);
      } catch (error) {
        console.error('Error fetching exam:', error);
        alert("Failed to load exam. It might have been unpublished.");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [isAuthenticated, user, router, examId]);

  const handleStartExam = async () => {
    try {
      router.push(`/exams/${examId}/take`);
    } catch (err) {
      console.error(err);
      alert('Could not start exam');
    }
  };

  if (loading) return <div className="p-8 text-center text-bsg-blue font-semibold">Loading Exam Details...</div>;
  if (!exam) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-bsg-blue p-8 text-white relative overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <Link href="/dashboard" className="text-blue-200 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-extrabold mb-2 leading-tight">{exam.title}</h1>
            <p className="text-blue-100 text-lg font-medium">{exam.description || 'Mandatory CBT Assessment'}</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-blue-50 p-4 md:p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
              <div className="text-2xl md:text-3xl mb-2">⏱️</div>
              <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Duration</h3>
              <p className="text-xl md:text-2xl font-extrabold text-bsg-blue">{exam.durationMinutes} Mins</p>
            </div>
            <div className="bg-yellow-50 p-4 md:p-6 rounded-xl border border-yellow-100 flex flex-col items-center justify-center">
              <div className="text-2xl md:text-3xl mb-2">📋</div>
              <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Questions</h3>
              <p className="text-xl md:text-2xl font-extrabold text-yellow-700">{exam.questions?.length || 0}</p>
            </div>
            <div className="bg-green-50 p-4 md:p-6 rounded-xl border border-green-100 flex flex-col items-center justify-center">
              <div className="text-2xl md:text-3xl mb-2">🎯</div>
              <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider">Passing</h3>
              <p className="text-xl md:text-2xl font-extrabold text-green-700">50%</p>
            </div>
          </div>

          <div className="bg-red-50 p-6 md:p-8 rounded-2xl border border-red-200 mb-8 shadow-sm">
            <h3 className="text-lg font-extrabold text-red-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Strict Anti-Cheat Rules
            </h3>
            <ul className="space-y-4 text-red-800 font-medium text-sm md:text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 font-bold">•</span>
                <span><strong>Fullscreen is Enforced:</strong> The exam will lock your screen. Exiting fullscreen will issue a warning.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 font-bold">•</span>
                <span><strong>No Leaving the Window:</strong> If you switch tabs, minimize the browser, open another app, or get a notification that covers the screen, you will get a warning.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 font-bold">•</span>
                <span><strong>Strict 1-Warning Policy:</strong> You get exactly 1 warning. On your 2nd violation, the exam will instantly terminate and submit your current score.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 font-bold">•</span>
                <span><strong>No Copying:</strong> Copying text, right-clicking, and keyboard shortcuts are disabled.</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleStartExam}
              className="bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-extrabold text-lg px-8 py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 w-full flex items-center justify-center gap-2"
            >
              I Understand, Start Exam &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
