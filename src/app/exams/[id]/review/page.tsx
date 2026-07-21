'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, XCircle, ArrowLeft, BrainCircuit, Circle } from 'lucide-react';

export default function ExamReviewPage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchDetailedResult = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/attempts/results/${resultId}/detailed`, {
          withCredentials: true,
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching detailed result:', error);
        alert("Could not load your detailed exam review.");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedResult();
  }, [_hasHydrated, isAuthenticated, user, router, resultId]);

  if (loading || !_hasHydrated) return <div className="min-h-screen flex items-center justify-center text-bsg-blue font-semibold text-lg animate-pulse">Loading detailed analysis...</div>;
  if (!data) return null;

  const { result, questionDetails } = data;
  const exam = result.examId;
  const percentage = (result.score / result.totalMarks) * 100;
  const isPassed = percentage >= 50;

  return (
    <div className="min-h-screen bg-gray-50/50 relative py-8 px-4 sm:px-6 lg:px-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bsg-blue/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-bsg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-bsg-blue-light/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10 print:hidden">
        
        {/* Navigation */}
        <Link href={user?.role === 'Candidate' ? '/dashboard' : `/examiner/exams/${exam._id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" /> {user?.role === 'Candidate' ? 'Back to Dashboard' : 'Back to Results Database'}
        </Link>

        {/* Header Summary */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden ring-1 ring-black/5">
          <div className={`p-6 sm:p-8 text-white ${isPassed ? 'bg-gradient-to-br from-green-600 to-emerald-500' : 'bg-gradient-to-br from-red-600 to-rose-500'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 inline-block">
                  {exam.title}
                </span>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold mb-1 sm:mb-2">
                  {isPassed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
                </h1>
                <p className="text-white/90 text-sm sm:text-lg">You scored {result.score} out of {result.totalMarks} marks.</p>
              </div>
              <div className="bg-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl text-center shadow-lg border border-gray-100 shrink-0">
                <span className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 mb-1">Total Score</span>
                <span className={`text-3xl sm:text-5xl font-black ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 print:border-none print:shadow-none ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              Question Breakdown
              <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full font-semibold">
                {questionDetails.length} Questions
              </span>
            </h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto print:hidden">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-bsg-blue focus:border-bsg-blue flex-1 min-w-[200px]"
              />
              <button 
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = `${exam.title} - BSG Portal`;
                  window.print();
                  document.title = originalTitle;
                }}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg flex items-center gap-2"
              >
                🖨️ Print Master Paper
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {questionDetails
              .filter((q: any) => q.text.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((q: any, index: number) => {
              const isUnanswered = q.candidateAnswerIndex === null || q.candidateAnswerIndex === undefined;
              
              let headerStyle = 'bg-gray-50 border-gray-200 text-gray-500';
              let Icon = Circle;
              
              if (!isUnanswered) {
                if (q.isCorrect) {
                  headerStyle = 'bg-green-50 border-green-200 text-green-700';
                  Icon = CheckCircle2;
                } else {
                  headerStyle = 'bg-red-50 border-red-200 text-red-700';
                  Icon = XCircle;
                }
              }

              return (
                <div key={q._id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm print:break-inside-avoid print:border-gray-300">
                  {/* Question Header */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${headerStyle} print:bg-gray-100 print:text-black print:border-gray-300`}>
                    <div className="flex items-center gap-3 font-bold">
                      <Icon size={20} className={q.isCorrect ? 'text-green-600' : (!isUnanswered ? 'text-red-600' : 'text-gray-400')} />
                      <span>Question {index + 1}</span>
                    </div>
                    <div className="text-sm font-bold opacity-80">
                      {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-6">
                                        <div className="mb-6">
                      {q.viewedLanguage === 'hi' && (
                        <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 border border-green-200 print:bg-transparent print:border-black print:text-black">Answered in Hindi</span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 whitespace-pre-wrap">
                        {q.viewedLanguage === 'hi' && q.textHindi ? q.textHindi : q.text}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {(q.viewedLanguage === 'hi' && q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : q.options).map((opt: string, optIdx: number) => {
                        const isCandidateChoice = q.candidateAnswerIndex === optIdx;
                        const isCorrectChoice = q.correctOptionIndex === optIdx;
                        
                        let optionStyle = 'border-gray-200 text-gray-600 bg-white';
                        let labelStyle = 'bg-gray-100 border-gray-200 text-gray-500';
                        
                        if (isCorrectChoice) {
                          optionStyle = 'border-green-500 bg-green-50 text-green-900 font-medium ring-1 ring-green-500 print:border-green-800 print:bg-white print:text-black';
                          labelStyle = 'bg-green-500 border-green-500 text-white print:text-black print:bg-white print:border-green-800';
                        } else if (isCandidateChoice && !isCorrectChoice) {
                          optionStyle = 'border-red-300 bg-red-50 text-red-900 font-medium print:border-red-800 print:bg-white print:text-black';
                          labelStyle = 'bg-red-500 border-red-500 text-white print:text-black print:bg-white print:border-red-800';
                        }

                        return (
                          <div key={optIdx} className={`flex items-center p-4 border rounded-xl transition-all ${optionStyle}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border text-sm font-bold mr-4 flex-shrink-0 ${labelStyle}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            
                            {/* Badges for clarity */}
                            {isCorrectChoice && (
                              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded-md print:bg-transparent print:border print:border-green-800">Correct Answer</span>
                            )}
                            {isCandidateChoice && !isCorrectChoice && (
                              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-1 rounded-md print:bg-transparent print:border print:border-red-800">Your Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {isUnanswered && (
                      <div className="mt-4 text-sm font-bold text-gray-500 flex items-center gap-2">
                        <Circle size={16} /> You did not answer this question.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FORMAL PRINT SECTION (Master Paper Style) */}
      <div className="hidden print:block bg-white text-black w-full" style={{ fontFamily: 'Times New Roman, serif' }}>
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold uppercase">{exam.title}</h1>
          <h2 className="text-xl mt-2">{exam.category || 'General Assessment'}</h2>
          <div className="flex justify-between mt-4 text-sm font-bold px-10">
            <span>Total Marks: {result.totalMarks}</span>
            <span>Score Obtained: {result.score}</span>
            <span>Percentage: {percentage.toFixed(0)}%</span>
          </div>
          {exam.description && <p className="mt-4 italic text-sm">{exam.description}</p>}
          <div className="mt-4 flex justify-between text-xs text-gray-500 px-10">
            <span>Candidate Name: {user?.name || '_______________________'}</span>
            <span>BSG ID: {user?.bsgId || '_______________'}</span>
            <span>Date: {new Date(result.endTime).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-8">
          {questionDetails.map((q: any, idx: number) => {
            const isUnanswered = q.candidateAnswerIndex === null || q.candidateAnswerIndex === undefined;
            return (
              <div key={q._id} className="break-inside-avoid">
                <div className="flex items-start gap-2">
                  <span className="font-bold whitespace-nowrap">Q.{idx + 1}</span>
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">
                        {q.viewedLanguage === 'hi' && (
                          <span className="block text-[10px] uppercase font-bold mb-1">[Hindi Version]</span>
                        )}
                        {q.viewedLanguage === 'hi' && q.textHindi ? q.textHindi : q.text}
                      </p>
                      <span className="font-bold text-sm ml-4 whitespace-nowrap">[{q.marks || 1} Marks]</span>
                    </div>
                    
                    {q.section && (
                      <p className="text-xs text-gray-600 mt-1 mb-2 font-bold uppercase">Section: {q.section}</p>
                    )}

                    {q.mediaUrl && (
                      <div className="my-4">
                        <img 
                          src={q.mediaUrl.startsWith('http') ? q.mediaUrl : `${API_URL}${q.mediaUrl}`} 
                          alt="Question image" 
                          className="max-h-48 border border-gray-300" 
                        />
                      </div>
                    )}

                    {q.type === 'Subjective' ? (
                      <div className="mt-4 w-full border-b border-black border-dashed h-24"></div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                        {((q.viewedLanguage === 'hi' && q.optionsHindi && q.optionsHindi.length > 0 ? q.optionsHindi : q.options) || []).map((opt: string, optIdx: number) => {
                          const isCandidateChoice = q.candidateAnswerIndex === optIdx;
                          const isCorrectChoice = q.correctOptionIndex === optIdx;
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="font-bold">({['A', 'B', 'C', 'D'][optIdx]})</span>
                              <span className={isCorrectChoice ? 'font-bold underline' : ''}>{opt}</span>
                              
                              {isCorrectChoice && (
                                <span className="text-xs ml-2 border border-black px-1 inline-block bg-black text-white">Correct</span>
                              )}
                              {isCandidateChoice && !isCorrectChoice && (
                                <span className="text-xs ml-2 border border-black px-1 inline-block text-black font-bold">Your Answer ❌</span>
                              )}
                              {isCandidateChoice && isCorrectChoice && (
                                <span className="text-xs ml-2 border border-black px-1 inline-block text-black font-bold">Your Answer ✅</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {isUnanswered && (
                       <div className="mt-2 text-sm italic border border-black inline-block px-2 py-0.5">Not Answered</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { -webkit-print-color-adjust: exact; background: white !important; }
            @page { margin: 1.5cm; }
          }
        `}} />
      </div>
    </div>
  );
}
