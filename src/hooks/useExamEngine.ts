import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { openDB } from 'idb';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/utils/apiConfig';

interface AttemptData {
  _id: string;
  candidateId: string;
  status: string;
  answers: any[];
}

export function useExamEngine(examId: string) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Exam
  useEffect(() => {
    const initExam = async () => {
      try {
        const { data } = await axios.post(`${API_URL}/api/exams/${examId}/start`, {}, { withCredentials: true });
        
        // Setup IndexedDB
        const db = await openDB('bsg-cbt', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('examState')) {
              db.createObjectStore('examState');
            }
          },
        });
        
        // Recover from local state if newer
        const localState = await db.get('examState', examId);
        
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setExamTitle(data.examTitle);
        
        if (localState && localState.attemptId === data.attempt._id) {
          setTimeRemaining(localState.timeRemaining);
          setAttempt((prev: AttemptData | null) => prev ? ({ ...prev, answers: localState.answers }) : prev);
        } else {
          setTimeRemaining(data.attempt.timeRemaining);
        }

        // Connect Socket
        const newSocket = io(API_URL, { withCredentials: true });
        setSocket(newSocket);
        
        newSocket.emit('join-exam', { examId, candidateId: data.attempt.candidateId });
        
        newSocket.on('force-pause', () => {
          alert('Your exam has been paused by the invigilator.');
          // In a real app, this would show an overlay and disable inputs
        });

      } catch (error) {
        console.error('Failed to start exam:', error);
        alert('Failed to start exam. It may not exist or you may be blocked.');
        router.push('/dashboard');
      }
    };
    initExam();
  }, [examId, router]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      await axios.post(`${API_URL}/api/attempts/${attempt._id}/submit`, {}, { withCredentials: true });
      
      // Clear IDB
      const db = await openDB('bsg-cbt', 1);
      await db.delete('examState', examId);
      
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      router.push('/dashboard');
      alert('Exam submitted successfully!');
    } catch (error) {
      console.error('Submission failed', error);
      alert('Submission failed. Please try again or contact invigilator.');
      setIsSubmitting(false);
    }
  }, [attempt, examId, isSubmitting, router]);

  // Timer & Heartbeat Sync (every 10 seconds)
  useEffect(() => {
    if (!attempt || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const heartbeatInterval = setInterval(async () => {
      try {
        // Save to IndexedDB
        const db = await openDB('bsg-cbt', 1);
        await db.put('examState', {
          attemptId: attempt._id,
          timeRemaining,
          answers: attempt.answers,
        }, examId);

        // Sync with Server
        await axios.post(`${API_URL}/api/attempts/${attempt._id}/heartbeat`, {
          timeRemaining,
          answers: attempt.answers,
          warnings,
        }, { withCredentials: true });

        // Emit Socket Event
        if (socket) {
          socket.emit('status-update', {
            examId,
            candidateId: attempt.candidateId,
            status: attempt.status,
            warnings,
          });
        }
      } catch (error) {
        console.error('Heartbeat sync failed:', error);
      }
    }, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(heartbeatInterval);
      if (socket) socket.disconnect();
    };
  }, [attempt, timeRemaining, warnings, isSubmitting, examId, socket, handleSubmit]);

  // Anti-cheat mechanisms
  useEffect(() => {
    if (!attempt) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => {
          const newWarnings = prev + 1;
          alert(`Warning! Tab switching is not allowed. Warning count: ${newWarnings}/1`);
          if (newWarnings >= 1) {
            handleSubmit();
          }
          return newWarnings;
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v') || e.key === 'F12') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
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
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [attempt, handleSubmit]);

  const selectOption = (questionId: string, optionIndex: number) => {
    setAttempt((prev: AttemptData | null) => prev ? ({
      ...prev,
      answers: prev.answers.map((ans: any) => 
        ans.questionId === questionId 
          ? { ...ans, selectedOptionIndex: optionIndex, status: 'Answered' } 
          : ans
      )
    }) : prev);
  };

  const markForReview = (questionId: string) => {
    setAttempt((prev: AttemptData | null) => prev ? ({
      ...prev,
      answers: prev.answers.map((ans: any) => 
        ans.questionId === questionId 
          ? { ...ans, status: 'MarkedForReview' } 
          : ans
      )
    }) : prev);
  };
  
  const clearResponse = (questionId: string) => {
    setAttempt((prev: AttemptData | null) => prev ? ({
      ...prev,
      answers: prev.answers.map((ans: any) => 
        ans.questionId === questionId 
          ? { ...ans, selectedOptionIndex: undefined, status: 'Unanswered' } 
          : ans
      )
    }) : prev);
  };

  return {
    attempt,
    questions,
    examTitle,
    timeRemaining,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectOption,
    markForReview,
    clearResponse,
    handleSubmit,
    isSubmitting
  };
}
