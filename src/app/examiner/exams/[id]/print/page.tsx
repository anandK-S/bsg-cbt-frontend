'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';

export default function MasterQuestionPaper() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || (user?.role !== 'Examiner' && user?.role !== 'Admin')) {
      router.push('/');
      return;
    }

    const fetchExam = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/exams/${examId}`, {
          withCredentials: true,
        });
        setExam(data);
      } catch (error) {
        console.error('Error fetching exam:', error);
        alert('Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [_hasHydrated, isAuthenticated, user, router, examId]);

  // Auto-print once exam is loaded
  useEffect(() => {
    if (exam && !printed) {
      setPrinted(true);
      setTimeout(() => window.print(), 800);
    }
  }, [exam, printed]);

  if (!_hasHydrated || loading) return (
    <div className="p-10 text-center">
      <div className="text-2xl font-bold mb-2">Loading Question Paper...</div>
      <div className="text-gray-500">Please wait while we prepare the document.</div>
    </div>
  );
  if (!exam) return <div className="p-10 text-center text-red-500 font-bold">Exam not found.</div>;

  const totalMarks = exam.questions.reduce((acc: number, q: any) => acc + (q.marks || 1), 0);

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Print button - hidden when printing */}
      <div className="print:hidden mb-6 flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex-1">
          <p className="font-bold text-gray-900">Master Question Paper — {exam.title}</p>
          <p className="text-sm text-gray-500">{exam.questions.length} Questions · {totalMarks} Marks · {exam.durationMinutes} Minutes</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-black transition-colors"
        >
          🖨️ Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Document Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase">{exam.title}</h1>
        <h2 className="text-xl mt-2">{exam.category || 'General Assessment'}</h2>
        <div className="flex justify-between mt-4 text-sm font-bold px-10">
          <span>Total Marks: {totalMarks}</span>
          <span>Duration: {exam.durationMinutes} Minutes</span>
        </div>
        {exam.description && <p className="mt-4 italic text-sm">{exam.description}</p>}
        <div className="mt-4 flex justify-between text-xs text-gray-500 px-10">
          <span>Candidate Name: _______________________</span>
          <span>BSG ID: _______________</span>
          <span>Date: _______________</span>
        </div>
      </div>

      <div className="space-y-8">
        {exam.questions.map((q: any, idx: number) => (
          <div key={q.questionId._id} className="break-inside-avoid">
            <div className="flex items-start gap-2">
              <span className="font-bold whitespace-nowrap">Q.{idx + 1}</span>
              <div className="w-full">
                <div className="flex justify-between items-start">
                  <p className="font-medium">{q.questionId.text}</p>
                  <span className="font-bold text-sm ml-4 whitespace-nowrap">[{q.marks || 1} Marks]</span>
                </div>
                
                {q.questionId.section && (
                  <p className="text-xs text-gray-600 mt-1 mb-2 font-bold uppercase">Section: {q.questionId.section}</p>
                )}

                {/* Image between question and options */}
                {q.questionId.mediaUrl && (
                  <div className="my-4">
                    <img 
                      src={q.questionId.mediaUrl.startsWith('http') ? q.questionId.mediaUrl : `${API_URL}${q.questionId.mediaUrl}`} 
                      alt="Question image" 
                      className="max-h-48 border border-gray-300" 
                    />
                  </div>
                )}

                {q.questionId.type === 'Subjective' ? (
                  <div className="mt-4 w-full border-b border-black border-dashed h-24"></div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                    {q.questionId.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="font-bold">({['A', 'B', 'C', 'D'][optIdx]})</span>
                        <span>{opt}</span>
                        {q.questionId.correctOptionIndex === optIdx && (
                          <span className="text-xs ml-2 border border-black px-1 print:hidden inline-block bg-black text-white">Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
