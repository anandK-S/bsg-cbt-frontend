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
  const [printLang, setPrintLang] = useState<'English' | 'Hindi' | 'Bilingual'>('English');

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

  useEffect(() => {
    if (exam) {
      document.title = `${exam.title} bsg-cbt`;
    }
  }, [exam]);

  if (!_hasHydrated || loading) return (
    <div className="p-10 text-center">
      <div className="text-2xl font-bold mb-2">Loading Question Paper...</div>
      <div className="text-gray-500">Please wait while we prepare the document.</div>
    </div>
  );
  if (!exam) return <div className="p-10 text-center text-red-500 font-bold">Exam not found.</div>;

  const totalMarks = (exam.questions || []).reduce((acc: number, q: any) => acc + (q.marks || 1), 0);

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Print button - hidden when printing */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex-1 w-full">
          <p className="font-bold text-gray-900">Master Question Paper — {exam.title}</p>
          <p className="text-sm text-gray-500">{(exam.questions || []).length} Questions · {totalMarks} Marks · {exam.durationMinutes} Minutes</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select 
            value={printLang} 
            onChange={(e) => setPrintLang(e.target.value as any)}
            className="bg-white border border-gray-300 text-gray-900 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-gray-900 transition-colors flex-1 sm:flex-none"
          >
            <option value="English">English Only</option>
            <option value="Hindi">Hindi Only</option>
            <option value="Bilingual">Bilingual</option>
          </select>
          <button
            onClick={() => window.print()}
            className="bg-gray-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-black transition-colors flex-1 sm:flex-none whitespace-nowrap"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex-1 sm:flex-none"
          >
            Back
          </button>
        </div>
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
        {(exam.questions || []).map((q: any, idx: number) => {
          if (!q.questionId) return null;
          return (
            <div key={q.questionId._id || idx} className="break-inside-avoid">
              <div className="flex items-start gap-2">
                <span className="font-bold whitespace-nowrap">Q.{idx + 1}</span>
                <div className="w-full">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{printLang === 'Hindi' && q.questionId.textHindi ? q.questionId.textHindi : q.questionId.text}</p>
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
                        {(printLang === 'Hindi' && q.questionId.optionsHindi && q.questionId.optionsHindi.length === 4 ? q.questionId.optionsHindi : (q.questionId.options || [])).map((opt: string, optIdx: number) => (
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

                    {printLang === 'Bilingual' && q.questionId.textHindi && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="font-medium">{q.questionId.textHindi}</p>
                        {q.questionId.type !== 'Subjective' && q.questionId.optionsHindi && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                            {(q.questionId.optionsHindi).map((opt: string, optIdx: number) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="font-bold">({['क', 'ख', 'ग', 'घ'][optIdx]})</span>
                                <span>{opt}</span>
                                {q.questionId.correctOptionIndex === optIdx && (
                                  <span className="text-xs ml-2 border border-black px-1 print:hidden inline-block bg-black text-white">सही</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Answer Key Section */}
      <div className="mt-12 pt-8 border-t-2 border-black break-before-page">
        <h2 className="text-2xl font-bold text-center mb-6 uppercase">Answer Key</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 text-sm">
          {(exam.questions || []).map((q: any, idx: number) => {
            if (!q.questionId) return null;
            let ans = '';
            if (q.questionId.type === 'Subjective') {
              ans = (q.questionId.acceptableAnswers || []).join(', ');
            } else {
              ans = ['A', 'B', 'C', 'D'][q.questionId.correctOptionIndex];
            }
            return (
              <div key={`ans-${idx}`} className="flex gap-4 border-b border-gray-300 pb-1">
                <span className="font-bold w-12 shrink-0">Q.{idx + 1}</span>
                <span className="font-medium text-gray-800">{ans}</span>
              </div>
            );
          })}
        </div>
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
