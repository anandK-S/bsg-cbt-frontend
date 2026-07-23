import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';
import { camelCaseResponse } from '@/utils/apiResponse';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { testKey } = body;

    const { data: exam, error } = await supabase.from('exams').select('*').eq('id', (await params).id).single();
    if (error || !exam) throw new Error('Exam not found');

    if (exam.test_key && exam.test_key !== testKey) {
      return camelCaseResponse({ message: 'Invalid test key' }, { status: 403 });
    }

    // Check for existing attempt
    let { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', (await params).id)
      .eq('candidate_id', auth.id)
      .single();

    if (attempt && attempt.status === 'Completed') {
      return camelCaseResponse({ message: 'Exam already completed' }, { status: 403 });
    }

    if (!attempt) {
      // Create new attempt
      const { data: newAttempt, error: newAttemptError } = await supabaseAdmin.from('exam_attempts').insert([{
        exam_id: (await params).id,
        candidate_id: auth.id,
        status: 'In-Progress',
        time_remaining: (exam.duration_minutes * 60) + (exam.duration_seconds || 0)
      }]).select().single();
      
      if (newAttemptError) throw newAttemptError;
      attempt = newAttempt;
    }

    // Fetch questions to send to frontend
    const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', (await params).id);
    
    // Map data for frontend
    const mappedQuestions = (questions || []).map(q => ({
      ...q,
      _id: q.id,
      correctOptionIndex: undefined, // Hide correct answer
      acceptableAnswers: undefined
    }));

    return camelCaseResponse({
      attempt: { 
        ...attempt, 
        _id: attempt.id,
        answers: mappedQuestions.map(q => ({ questionId: q._id, status: 'NotVisited' }))
      },
      questions: mappedQuestions,
      examTitle: exam.title,
      durationMinutes: exam.duration_minutes
    });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
