'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
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

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchDetailedResult = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/attempts/results/${resultId}/detailed`, {
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation */}
        <Link href={user?.role === 'Candidate' ? '/dashboard' : `/examiner/exams/${exam._id}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" /> {user?.role === 'Candidate' ? 'Back to Dashboard' : 'Back to Results Database'}
        </Link>

        {/* Header Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`p-8 text-white ${isPassed ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 inline-block">
                  {exam.title}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                  {isPassed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
                </h1>
                <p className="text-white/90 text-lg">You scored {result.score} out of {result.totalMarks} marks.</p>
              </div>
              <div className="bg-white/20 px-8 py-6 rounded-2xl text-center backdrop-blur-md border border-white/30 shadow-lg">
                <span className="block text-sm font-bold uppercase tracking-wider text-white/90 mb-1">Total Score</span>
                <span className="text-5xl font-black">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BrainCircuit className="text-bsg-blue" size={24} /> AI Tutor Feedback
            </h3>
            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed font-medium">
                <ReactMarkdown>{result.aiFeedback || "No feedback generated."}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
            Question Breakdown
            <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full font-semibold">
              {questionDetails.length} Questions
            </span>
          </h2>

          <div className="space-y-8">
            {questionDetails.map((q: any, index: number) => {
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
                <div key={q._id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Question Header */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center ${headerStyle}`}>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{q.text}</h3>
                    
                    <div className="space-y-3">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isCandidateChoice = q.candidateAnswerIndex === optIdx;
                        const isCorrectChoice = q.correctOptionIndex === optIdx;
                        
                        let optionStyle = 'border-gray-200 text-gray-600 bg-white';
                        let labelStyle = 'bg-gray-100 border-gray-200 text-gray-500';
                        
                        if (isCorrectChoice) {
                          optionStyle = 'border-green-500 bg-green-50 text-green-900 font-medium ring-1 ring-green-500';
                          labelStyle = 'bg-green-500 border-green-500 text-white';
                        } else if (isCandidateChoice && !isCorrectChoice) {
                          optionStyle = 'border-red-300 bg-red-50 text-red-900 font-medium';
                          labelStyle = 'bg-red-500 border-red-500 text-white';
                        }

                        return (
                          <div key={optIdx} className={`flex items-center p-4 border rounded-xl transition-all ${optionStyle}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border text-sm font-bold mr-4 flex-shrink-0 ${labelStyle}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            
                            {/* Badges for clarity */}
                            {isCorrectChoice && (
                              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded-md">Correct Answer</span>
                            )}
                            {isCandidateChoice && !isCorrectChoice && (
                              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-1 rounded-md">Your Answer</span>
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
    </div>
  );
}
