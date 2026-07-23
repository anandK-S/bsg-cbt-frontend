'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import { Menu, X, CheckCircle2, Circle, Clock, UserCircle, Save, Eraser, BookmarkPlus, AlertTriangle } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import QRCode from 'react-qr-code';

// Status Types for Government BSG
type QuestionStatus = 'NotVisited' | 'Visited' | 'Answered' | 'MarkedForReview' | 'AnsweredAndMarkedForReview';

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
  const { language, setLanguage, t } = useLanguage();
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
        const { data } = await axios.post(`${API_URL}/api/exams/${examId}/start`, {}, {
          withCredentials: true,
        });
        
        setAttemptId(data.attempt._id);
        attemptIdRef.current = data.attempt._id;
        setExamTitle(data.examTitle);
        setQuestions(data.questions);
        
        // Check for offline cached answers first
        const cachedAnswersStr = localStorage.getItem(`attempt_answers_${data.attempt._id}`);
        let initAnswers = [...data.attempt.answers];
        if (cachedAnswersStr) {
          try {
            const cachedAnswers = JSON.parse(cachedAnswersStr);
            // Verify cache matches question length to avoid stale data
            if (cachedAnswers.length === data.attempt.answers.length) {
              initAnswers = cachedAnswers;
            }
          } catch(e) {}
        }
        
        // Ensure initial question is marked as Visited if it was NotVisited
        if (initAnswers.length > 0 && initAnswers[0].status === 'NotVisited') {
          initAnswers[0].status = 'Visited';
          localStorage.setItem(`attempt_answers_${data.attempt._id}`, JSON.stringify(initAnswers));
        }
        setAnswers(initAnswers);
        
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

  const handleAutoSubmit = useCallback(async (forcedViolationReason?: string) => {
    if (isSubmittingRef.current || !attemptIdRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    // Auto-exit fullscreen
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(err => console.error(err));
    }
    
    try {
      const payload: any = {
        answers: answersRef.current,
        timeRemaining: timeRemainingRef.current
      };
      if (forcedViolationReason) {
        payload.violationReason = forcedViolationReason;
      }
      
      const { data } = await axios.post(`${API_URL}/api/attempts/${attemptIdRef.current}/submit`, payload, {
        withCredentials: true,
      });
      localStorage.removeItem(`attempt_answers_${attemptIdRef.current}`);
      router.push('/dashboard');
    } catch (e: any) {
      if (e.response?.status === 400 || e.response?.status === 404) {
        localStorage.removeItem(`attempt_answers_${attemptIdRef.current}`);
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
        await axios.post(`${API_URL}/api/attempts/${attemptIdRef.current}/heartbeat`, {
          answers: answersRef.current,
          timeRemaining: timeRemainingRef.current,
          warnings: warningsRef.current
        }, { withCredentials: true });
      } catch (e) {
        console.error("Heartbeat sync failed", e);
      }
    }, 10000); // sync every 10 seconds

    return () => clearInterval(syncInterval);
  }, [loading, isSubmitting]);

  // Socket listener for Examiner Force Pause
  useEffect(() => {
    if (loading || isSubmitting || !attemptIdRef.current) return;

    const socket = io(API_URL, { withCredentials: true });
    
    socket.on('connect', () => {
      socket.emit('join-exam', { examId, candidateId: user?._id });
    });

    socket.on('force-pause', (data: any) => {
      if (data.candidateId === user?._id) {
        alert("Your exam has been forcefully terminated by an Examiner.");
        handleAutoSubmit("Exam forcefully terminated by Examiner");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loading, isSubmitting, examId, user?._id, handleAutoSubmit]);

  const handleManualSubmit = async () => {
    if (window.confirm("Are you sure you want to submit your exam early? You cannot undo this action.")) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleAutoSubmit();
    }
  };

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const enforceFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('User must interact first to enable fullscreen');
    }
  };

  const handleWarning = useCallback((msg: string) => {
    setWarnings(prev => {
      const newWarnings = prev + 1;
      if (newWarnings >= 1) {
        handleAutoSubmit('Exceeded maximum exam environment violations.');
      } else {
        setWarningMessage(`${msg} Warning count: ${newWarnings}/1`);
      }
      return newWarnings;
    });
  }, [handleAutoSubmit]);

  // Anti-cheat mechanisms
  useEffect(() => {
    if (loading || isSubmitting) return;

    // Push initial state to trap back button deeply for mobile edge swipes
    for (let i = 0; i < 3; i++) {
      window.history.pushState(null, '', window.location.href);
    }

    const handlePopState = (e: PopStateEvent) => {
      // Force them back forward if they swipe back
      window.history.pushState(null, '', window.location.href);
      handleWarning('You tried to use the Back button or swipe back gesture. This is strictly prohibited.');
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        // If they press the home button or switch apps on phone, this triggers.
        // We log a severe warning that pauses their ability to interact.
        handleWarning('App minimized or tab switched. This is a severe security violation.');
      }
    };

    const handleBlur = () => {
      // On some mobile devices, blur fires before visibilitychange when switching apps
      handleWarning('You left the exam window or opened another app/overlay.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleWarning('You exited fullscreen mode. This is prohibited.');
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Even if in an input, block inspect element and escape and functions
      if (
        (e.ctrlKey && e.key === 'c') || 
        (e.ctrlKey && e.key === 'v') || 
        (e.ctrlKey && e.key === 'r') ||
        e.key.startsWith('F') ||
        e.key === 'Escape' || 
        e.altKey
      ) {
        e.preventDefault();
        return;
      }

      // If they are not typing in a text area, completely disable the keyboard on PC/Mobile
      if (!isInput) {
        e.preventDefault();
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    setTimeout(enforceFullscreen, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [loading, isSubmitting, handleAutoSubmit]);

  // BSG Actions
  const updateAnswerStatus = (index: number, changes: Partial<any>) => {
    const updatedAnswers = [...answers];
    const targetQId = questions[index]._id;
    const answerIndex = updatedAnswers.findIndex(a => a.questionId === targetQId);
    
    if (answerIndex > -1) {
      updatedAnswers[answerIndex] = { ...updatedAnswers[answerIndex], ...changes };
    }
    setAnswers(updatedAnswers);
    if (attemptIdRef.current) {
      localStorage.setItem(`attempt_answers_${attemptIdRef.current}`, JSON.stringify(updatedAnswers));
    }
  };

  const navigateToQuestion = (index: number) => {
    // When navigating away, check if current question was NotVisited and make it Visited
    const currentQId = questions[currentQuestionIndex]._id;
    const currentAnswer = answers.find(a => a.questionId === currentQId);
    if (currentAnswer && currentAnswer.status === 'NotVisited') {
      updateAnswerStatus(currentQuestionIndex, { status: 'Visited' });
    }

    // Set new index
    setCurrentQuestionIndex(index);
    
    // When landing on a new question, if it's NotVisited, mark it Visited immediately so it shows Red
    const nextQId = questions[index]._id;
    const nextAnswer = answers.find(a => a.questionId === nextQId);
    if (nextAnswer && nextAnswer.status === 'NotVisited') {
      // Need a fresh copy to avoid stale state in one render cycle
      setAnswers(prevAnswers => {
        const newAns = [...prevAnswers];
        const idx = newAns.findIndex(a => a.questionId === nextQId);
        if (idx > -1 && newAns[idx].status === 'NotVisited') {
          newAns[idx].status = 'Visited';
        }
        return newAns;
      });
    }
  };

  const selectOption = (optionIndex: number) => {
    updateAnswerStatus(currentQuestionIndex, { selectedOptionIndex: optionIndex, status: 'Answered', viewedLanguage: language });
  };

  const updateSubjectiveAnswer = (text: string) => {
    updateAnswerStatus(currentQuestionIndex, { subjectiveAnswer: text, status: text.trim() ? 'Answered' : 'Visited', viewedLanguage: language });
  };

  const clearResponse = () => {
    updateAnswerStatus(currentQuestionIndex, { selectedOptionIndex: null, subjectiveAnswer: null, status: 'Visited' });
  };

  const saveAndNext = () => {
    const currentQId = questions[currentQuestionIndex]._id;
    const currentAnswer = answers.find(a => a.questionId === currentQId);
    
    let newStatus: QuestionStatus = 'Visited';
    const isAnswered = (currentAnswer?.selectedOptionIndex !== undefined && currentAnswer?.selectedOptionIndex !== null) || 
                       (currentAnswer?.subjectiveAnswer && currentAnswer.subjectiveAnswer.trim() !== '');
    if (isAnswered) {
      newStatus = 'Answered';
    }
    
    updateAnswerStatus(currentQuestionIndex, { status: newStatus });
    
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    } else {
      handleManualSubmit();
    }
  };

  const markForReviewAndNext = () => {
    const currentQId = questions[currentQuestionIndex]._id;
    const currentAnswer = answers.find(a => a.questionId === currentQId);
    
    let newStatus: QuestionStatus = 'MarkedForReview';
    const isAnswered = (currentAnswer?.selectedOptionIndex !== undefined && currentAnswer?.selectedOptionIndex !== null) || 
                       (currentAnswer?.subjectiveAnswer && currentAnswer.subjectiveAnswer.trim() !== '');
    if (isAnswered) {
      newStatus = 'AnsweredAndMarkedForReview';
    }
    
    updateAnswerStatus(currentQuestionIndex, { status: newStatus });
    
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading || !_hasHydrated) return <LoadingScreen text="Initializing Secure BSG Environment..." />;
  if (!questions.length) return <div className="p-8 text-center text-red-500 font-bold">Error loading exam questions.</div>;

  const currentQ = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQ._id) || {};



  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 overflow-hidden select-none absolute inset-0 z-[100]">
      {/* Warning Modal */}
      {warningMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center border-4 border-red-500">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6 animate-pulse">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">{t("securityWarning")}</h3>
            <p className="text-gray-600 mb-8 font-bold text-lg leading-relaxed">
              {warningMessage}
            </p>
            <button
              onClick={() => {
                setWarningMessage(null);
                enforceFullscreen();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 px-4 rounded-xl shadow-md transition-all active:scale-95 text-lg uppercase tracking-wider"
            >
              {t("resumeExam")}
            </button>
          </div>
        </div>
      )}

      {/* Top Header - Strict Government Style */}
      <header className="bg-white border-b border-gray-300 px-2 md:px-4 py-2 flex flex-wrap justify-between items-center shadow-sm shrink-0 gap-y-2">
        <div className="flex flex-col flex-shrink-0">
          <h1 className="font-extrabold text-base md:text-lg text-bsg-blue truncate max-w-[120px] sm:max-w-md uppercase tracking-wide">{examTitle}</h1>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setLanguage('en')}
            className={`px-2 md:px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            English
          </button>
          <button 
            onClick={() => setLanguage('hi')}
            className={`px-2 md:px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            हिंदी
          </button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          <div className="hidden md:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full border object-cover" />
            ) : (
              <UserCircle className="w-8 h-8 text-gray-400" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</span>
              <span className="text-xs font-semibold text-gray-500">BSG ID: {user?.bsgId}</span>
            </div>
          </div>
          
          <div className={`flex flex-col items-center justify-center px-2 md:px-4 py-1 rounded-lg border-2 ${timeRemaining < 300 ? 'bg-red-50 text-red-600 border-red-500 animate-pulse' : 'bg-white text-gray-900 border-gray-300'}`}>
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">{t("timeLeft")}</span>
            <div className="flex items-center gap-1 md:gap-1.5">
              <Clock size={16} className={timeRemaining < 300 ? 'text-red-500' : 'text-gray-400'} />
              <span className="tabular-nums font-black text-base md:text-xl leading-none">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobilePaletteOpen(!isMobilePaletteOpen)}
            className="md:hidden p-1.5 md:p-2 bg-gray-100 rounded-lg text-gray-600 border border-gray-300"
          >
            {isMobilePaletteOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area - 70/30 Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative p-2 md:p-4 gap-4 bg-background">
        
        {/* Left Side: Question Area (70%) */}
        <div className="flex-1 flex flex-col w-full md:w-[70%] lg:w-[75%] glass-card rounded-2xl md:rounded-3xl overflow-hidden shadow-sm animate-[fade-in_0.5s_ease-out]">
          {/* Question Header */}
          <div className="bg-gray-100 border-b border-gray-300 px-6 py-2 flex justify-between items-center flex-wrap gap-2">
            <span className="font-extrabold text-gray-700 text-lg">{t("questionNo")} {currentQuestionIndex + 1}</span>
            <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
              {currentQ.section && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase tracking-wider text-xs border border-purple-200">{t("section")}: {currentQ.section}</span>}
              <span>{t("marks")}: <span className="text-green-600">+{currentQ.marks || 1}</span></span>
              <span>{t("type")}: <span className="text-gray-700">{currentQ.type === 'MultipleChoice' ? 'Multiple Choice' : currentQ.type === 'Subjective' ? 'Subjective' : currentQ.type === 'LogicDecision' ? 'Logic/Decision' : 'Single Choice'}</span></span>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {/* Question Content */}

            <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-6 whitespace-pre-wrap leading-relaxed break-words relative z-10">
              {language === 'hi' && currentQ.textHindi ? currentQ.textHindi : currentQ.text}
            </h2>

            {currentQ.mediaUrl && (
              <div className="mb-8 rounded-lg overflow-hidden border border-gray-200 inline-block max-w-full text-center relative z-10">
                <img 
                  src={currentQ.mediaUrl.startsWith('http') ? currentQ.mediaUrl : `${API_URL}${currentQ.mediaUrl}`} 
                  alt="Question Graphic" 
                  className="max-h-[300px] max-w-full object-contain mx-auto pointer-events-none select-none" 
                  draggable={false}
                />
              </div>
            )}

            <div className="space-y-4">
              {currentQ.type === 'Subjective' ? (
                <div className="w-full">
                  <textarea
                    value={currentAnswer.subjectiveAnswer || ''}
                    onChange={(e) => updateSubjectiveAnswer(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-lg focus:border-bsg-blue focus:ring-4 focus:ring-bsg-blue/10 outline-none resize-y text-lg text-gray-900 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder={t("typeYourAnswer")}
                  />
                </div>
              ) : (
                currentQ.options.map((opt: string, idx: number) => {
                  const isSelected = currentAnswer.selectedOptionIndex === idx;
                  const displayOpt = language === 'hi' && currentQ.optionsHindi && currentQ.optionsHindi[idx] ? currentQ.optionsHindi[idx] : opt;
                  return (
                    <div 
                      key={idx}
                      onClick={() => { if (!isSubmitting) selectOption(idx); }}
                      className={`flex items-start p-4 border rounded-lg transition-all ${isSubmitting ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${isSelected ? 'border-bsg-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white'}`}
                    >
                      <div className="flex-shrink-0 mr-4 mt-0.5">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full border-4 border-bsg-blue bg-white flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-bsg-blue"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-base font-medium break-words ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {displayOpt}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Action Buttons Footer */}
          <div className="bg-gray-50 border-t border-gray-300 p-4 md:px-6 flex flex-wrap justify-between items-center gap-3 shrink-0">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button 
                onClick={() => { if (currentQuestionIndex > 0) navigateToQuestion(currentQuestionIndex - 1); }}
                disabled={isSubmitting || currentQuestionIndex === 0}
                className="flex-1 sm:flex-none px-4 py-2 border border-blue-600 rounded-lg text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
              >
                {t('previous')}
              </button>
              <button 
                onClick={clearResponse} 
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                {t('clearResponse')}
              </button>
              <button 
                onClick={markForReviewAndNext} 
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 border border-purple-600 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                {t('markForReview')}
              </button>
            </div>
            <button 
              onClick={saveAndNext} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-2 border border-green-700 rounded-lg text-sm font-extrabold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {currentQuestionIndex === questions.length - 1 ? t('saveAndSubmit') : t('saveAndNext')}
            </button>
          </div>
        </div>

        {/* Right Side: Navigation Palette (30%) */}
        <div className={`fixed md:static inset-y-0 right-0 z-40 w-80 md:w-[30%] lg:w-[25%] glass-card rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm overflow-hidden transform transition-transform duration-300 flex flex-col animate-[fade-in_0.5s_ease-out] ${isMobilePaletteOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="p-4 bg-white border-b border-gray-300 flex justify-between items-center md:hidden">
            <h3 className="font-extrabold text-gray-900 uppercase">{t("questionPalette")}</h3>
            <button onClick={() => setIsMobilePaletteOpen(false)} className="p-2 bg-gray-100 rounded text-gray-700 border border-gray-300">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {/* Palette Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-6">
              {questions.map((q, idx) => {
                const ans = answers.find(a => a.questionId === q._id);
                const status = ans?.status || 'NotVisited';
                
                let badgeClass = '';
                
                // Colors exactly matching Government BSG styles
                if (status === 'NotVisited') {
                  badgeClass = 'bg-gray-200 border-gray-300 text-gray-700';
                } else if (status === 'Visited') {
                  badgeClass = 'bg-red-500 border-red-600 text-white'; // Red for visited not answered
                } else if (status === 'Answered') {
                  badgeClass = 'bg-green-600 border-green-700 text-white rounded-t-full rounded-b-md'; // Green for answered (often specific shape)
                } else if (status === 'MarkedForReview') {
                  badgeClass = 'bg-purple-600 border-purple-700 text-white rounded-full'; // Purple circle
                } else if (status === 'AnsweredAndMarkedForReview') {
                  badgeClass = 'bg-purple-600 border-purple-700 text-white rounded-full relative overflow-hidden'; // Purple with green dot
                }

                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => {
                      navigateToQuestion(idx);
                      if (window.innerWidth < 768) setIsMobilePaletteOpen(false);
                    }}
                    className={`relative w-full aspect-square flex items-center justify-center font-bold text-sm sm:text-base border shadow-sm transition-transform hover:scale-105 active:scale-95 ${badgeClass} ${isCurrent ? 'ring-4 ring-blue-300 z-10' : ''}`}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                    {status === 'AnsweredAndMarkedForReview' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="bg-white p-4 border border-gray-300 shadow-sm text-xs font-bold text-gray-700 grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 border border-gray-300 flex-shrink-0"></div>
                <span className="leading-tight">{t("notVisited")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 border border-red-600 flex-shrink-0"></div>
                <span className="leading-tight">{t("notAnswered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 border border-green-700 rounded-t-full rounded-b-sm flex-shrink-0"></div>
                <span className="leading-tight">{t("answered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 border border-purple-700 rounded-full flex-shrink-0"></div>
                <span className="leading-tight">{t("markedForReview")}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-6 h-6 bg-purple-600 border border-purple-700 rounded-full flex-shrink-0 relative">
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                </div>
                <span className="leading-tight">{t("answeredAndMarked")} (will be considered for evaluation)</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-100 border-t border-gray-300 mt-auto shrink-0">
            <button 
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 border border-blue-800 text-white font-extrabold py-3.5 rounded shadow-sm transition-colors disabled:opacity-50 text-base uppercase tracking-wider"
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isMobilePaletteOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobilePaletteOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
}
