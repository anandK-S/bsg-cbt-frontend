'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Menu, X, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function ExamTakePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [warnings, setWarnings] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const answersRef = useRef<any[]>([]);
  const timeRemainingRef = useRef<number>(0);
  const warningsRef = useRef<number>(0);

  // Sync state to refs for closures
  useEffect(() => {
    answersRef.current = answers;
    timeRemainingRef.current = timeRemaining;
    warningsRef.current = warnings;
  }, [answers, timeRemaining, warnings]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'Candidate') {
      router.push('/');
      return;
    }

    const startAttempt = async () => {
      try {
        const { data } = await axios.post(`http://localhost:5000/api/exams/${examId}/start`, {}, {
          withCredentials: true,
        });
        
        setAttemptId(data.attempt._id);
        attemptIdRef.current = data.attempt._id;
        setExamTitle(data.examTitle);
        setQuestions(data.questions);
        setAnswers(data.attempt.answers);
        setTimeRemaining(data.attempt.timeRemaining);
        
      } catch (error) {
        console.error('Error starting attempt:', error);
        alert("Failed to start the exam or you've already submitted it.");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    startAttempt();
  }, [_hasHydrated, isAuthenticated, user, router, examId]);

  const isSubmittingRef = useRef(false);

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !attemptIdRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    try {
      await axios.post(`http://localhost:5000/api/attempts/${attemptIdRef.current}/submit`, {
        answers: answersRef.current,
        timeRemaining: timeRemainingRef.current
      }, {
        withCredentials: true,
      });
      router.push(`/dashboard`); // Go to dashboard, they can view feedback from there
    } catch (e: any) {
      if (e.response?.status === 400) {
        // Already submitted
        router.push(`/dashboard`);
      } else {
        console.error("Auto submit failed", e);
        alert("Failed to submit the exam.");
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }, [router]);

  // Main Timer
  useEffect(() => {
    if (loading || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isSubmitting, handleAutoSubmit]);

  // Heartbeat sync
  useEffect(() => {
    if (loading || isSubmitting || !attemptIdRef.current) return;

    const syncInterval = setInterval(async () => {
      try {
        await axios.post(`http://localhost:5000/api/attempts/${attemptIdRef.current}/heartbeat`, {
          answers: answersRef.current,
          timeRemaining: timeRemainingRef.current,
          warnings: warningsRef.current
        }, { withCredentials: true });
      } catch (e) {
        console.error("Heartbeat sync failed", e);
      }
    }, 10000); // sync every 10 seconds safely using refs

    return () => clearInterval(syncInterval);
  }, [loading, isSubmitting]);

  const handleManualSubmit = async () => {
    if (window.confirm("Are you sure you want to submit your exam early? You cannot undo this.")) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleAutoSubmit();
    }
  };

  // Anti-cheat mechanisms
  useEffect(() => {
    if (loading || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => {
          const newWarnings = prev + 1;
          alert(`Warning! Tab switching or leaving the window is strictly prohibited. Warning count: ${newWarnings}/2`);
          if (newWarnings >= 2) {
            handleAutoSubmit();
          }
          return newWarnings;
        });
      }
    };

    const handleBlur = () => {
      setWarnings(prev => {
        const newWarnings = prev + 1;
        alert(`Warning! You left the exam window or opened another app. Warning count: ${newWarnings}/2`);
        if (newWarnings >= 2) {
          handleAutoSubmit();
        }
        return newWarnings;
      });
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setWarnings(prev => {
          const newWarnings = prev + 1;
          alert(`Warning! You exited fullscreen mode. This is prohibited. Warning count: ${newWarnings}/2`);
          if (newWarnings >= 2) {
            handleAutoSubmit();
          }
          return newWarnings;
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v') || e.key === 'F12' || e.key === 'Escape') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    // Enforce Fullscreen on mount if not already
    const enforceFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log('User must interact first to enable fullscreen');
      }
    };
    
    // Slight delay to allow interaction
    setTimeout(enforceFullscreen, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, isSubmitting, handleAutoSubmit]);

  const selectOption = (optionIndex: number) => {
    const updatedAnswers = [...answers];
    const currentQuestionId = questions[currentQuestionIndex]._id;
    
    const answerIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestionId);
    if (answerIndex > -1) {
      updatedAnswers[answerIndex] = {
        ...updatedAnswers[answerIndex],
        selectedOptionIndex: optionIndex,
        status: updatedAnswers[answerIndex].status === 'MarkedForReview' ? 'MarkedForReview' : 'Answered'
      };
    }
    setAnswers(updatedAnswers);
  };

  const toggleMarkForReview = () => {
    const updatedAnswers = [...answers];
    const currentQuestionId = questions[currentQuestionIndex]._id;
    
    const answerIndex = updatedAnswers.findIndex(a => a.questionId === currentQuestionId);
    if (answerIndex > -1) {
      const currentStatus = updatedAnswers[answerIndex].status;
      updatedAnswers[answerIndex].status = currentStatus === 'MarkedForReview' 
        ? (updatedAnswers[answerIndex].selectedOptionIndex !== undefined ? 'Answered' : 'Unanswered') 
        : 'MarkedForReview';
    }
    setAnswers(updatedAnswers);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading || !_hasHydrated) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-xl font-bold text-bsg-blue animate-pulse">Initializing Secure CBT Environment...</div></div>;
  if (!questions.length) return <div className="p-8 text-center text-red-500 font-bold">Error loading exam questions.</div>;

  const currentQ = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQ._id) || {};

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 overflow-hidden -mt-16 select-none">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex flex-col">
          <h1 className="font-extrabold text-lg text-gray-900 truncate max-w-[200px] sm:max-w-md">{examTitle}</h1>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-bold sm:text-lg border ${timeRemaining < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-bsg-blue border-blue-100'}`}>
            <Clock size={18} />
            <span className="tabular-nums">{formatTime(timeRemaining)}</span>
          </div>
          
          <button 
            onClick={() => setIsMobilePaletteOpen(!isMobilePaletteOpen)}
            className="md:hidden p-2 bg-gray-100 rounded-lg text-gray-600"
          >
            {isMobilePaletteOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col md:flex-row relative">
        
        {/* Left Side: Question Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-24 md:pb-0 h-[calc(100dvh-73px)] relative z-0">
          <div className="p-4 sm:p-8 flex-grow max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Q{currentQuestionIndex + 1}</span>
              <button 
                onClick={toggleMarkForReview}
                className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors border shadow-sm ${currentAnswer.status === 'MarkedForReview' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {currentAnswer.status === 'MarkedForReview' ? '★ Unmark' : '☆ Mark for Review'}
              </button>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
              {currentQ.text}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((opt: string, idx: number) => {
                const isSelected = currentAnswer.selectedOptionIndex === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => selectOption(idx)}
                    className={`flex items-center p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-bsg-blue bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'}`}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {isSelected ? (
                        <CheckCircle2 className="text-bsg-blue w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <Circle className="text-gray-300 w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="hidden sm:flex w-8 h-8 items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-500 font-bold mr-3 flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-base sm:text-lg ${isSelected ? 'font-semibold text-bsg-blue-dark' : 'text-gray-700'}`}>
                        {opt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Nav (Mobile Fixed, Desktop Static) */}
          <div className="fixed bottom-0 left-0 right-0 md:static bg-white p-4 border-t border-gray-200 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none z-10 md:mt-auto">
            <button 
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors border border-transparent disabled:border-transparent hover:border-gray-200"
            >
              &larr; Prev
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button 
                onClick={handleManualSubmit}
                className="px-6 py-3 font-bold text-white bg-bsg-gold hover:bg-yellow-500 rounded-lg transition-colors border border-transparent shadow-sm"
              >
                Submit Exam
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Navigation Palette (Drawer on Mobile, Sidebar on Desktop) */}
        <div className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${isMobilePaletteOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobilePaletteOpen(false)}></div>
        
        <div className={`fixed right-0 top-0 bottom-0 z-40 w-80 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none md:border-l md:border-gray-200 flex flex-col ${isMobilePaletteOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center md:hidden">
            <h3 className="font-bold text-gray-900">Question Palette</h3>
            <button onClick={() => setIsMobilePaletteOpen(false)} className="p-2 bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4 hidden md:block">Question Navigator</h3>
            
            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => {
                const ans = answers.find(a => a.questionId === q._id);
                let bgColor = 'bg-gray-100 border-gray-200 text-gray-500'; // Unanswered
                
                if (ans?.status === 'MarkedForReview') {
                  bgColor = 'bg-yellow-100 border-yellow-400 text-yellow-800';
                } else if (ans?.selectedOptionIndex !== undefined) {
                  bgColor = 'bg-green-100 border-green-400 text-green-800'; // Answered
                }
                
                if (idx === currentQuestionIndex) {
                  bgColor += ' ring-2 ring-bsg-blue ring-offset-2';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setIsMobilePaletteOpen(false);
                    }}
                    className={`h-10 rounded font-bold border transition-all flex items-center justify-center ${bgColor}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-100 border border-green-400 rounded block"></span> Answered</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded block"></span> Marked for Review</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded block"></span> Unanswered</div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-white">
            <button 
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="w-full bg-bsg-gold hover:bg-yellow-500 text-bsg-blue-dark font-extrabold py-4 rounded-xl shadow-sm transition-colors disabled:opacity-50 text-lg flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Final Exam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
