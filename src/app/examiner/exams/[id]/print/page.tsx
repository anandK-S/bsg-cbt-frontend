'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';

export default function MasterQuestionPaper() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        
        // Auto-print when loaded
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (error) {
        console.error('Error fetching exam:', error);
        alert('Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [isAuthenticated, user, router, examId]);

  if (loading) return <div className="p-10 text-center font-bold text-xl">Loading Question Paper...</div>;
  if (!exam) return <div className="p-10 text-center text-red-500 font-bold">Exam not found.</div>;

  return (
    <div className="bg-white min-h-screen p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase">{exam.title}</h1>
        <h2 className="text-xl mt-2">{exam.category || 'General Assessment'}</h2>
        <div className="flex justify-between mt-4 text-sm font-bold px-10">
          <span>Total Marks: {exam.questions.reduce((acc: number, q: any) => acc + (q.marks || 1), 0)}</span>
          <span>Duration: {exam.durationMinutes} Minutes</span>
        </div>
        {exam.description && <p className="mt-4 italic text-sm">{exam.description}</p>}
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

                {q.questionId.mediaUrl && (
                  <div className="my-4">
                    <img src={q.questionId.mediaUrl.startsWith('http') ? q.questionId.mediaUrl : `${API_URL}${q.questionId.mediaUrl}`} alt="Question image" className="max-h-48 border border-gray-300" />
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
