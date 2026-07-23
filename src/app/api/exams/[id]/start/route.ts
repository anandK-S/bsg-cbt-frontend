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

    // Check for existing attempt
    let { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', (await params).id)
      .eq('candidate_id', auth.id)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (attemptError && attemptError.code !== 'PGRST116') {
       // Ignore not found
    }

    if (attempt && !exam.allow_multiple_attempts && (attempt.status === 'Submitted' || attempt.status === 'Auto-Submitted' || attempt.status === 'Blocked')) {
      return camelCaseResponse({ message: 'Exam already completed' }, { status: 403 });
    }

    // Bypass test key if attempt is already in-progress
    if (!attempt || attempt.status !== 'In-Progress') {
      if (exam.test_key && exam.test_key !== testKey) {
        return camelCaseResponse({ message: 'Invalid test key' }, { status: 403 });
      }

      const now = new Date();
      if (exam.scheduled_start_date && new Date(exam.scheduled_start_date) > now) {
        return camelCaseResponse({ message: 'Exam has not started yet' }, { status: 403 });
      }
      if (exam.scheduled_end_date && new Date(exam.scheduled_end_date) < now) {
        return camelCaseResponse({ message: 'Exam has already expired' }, { status: 403 });
      }
    }

    // If there's an existing attempt and multiple attempts are allowed, 
    // and it's 'Submitted', we reuse it by updating its status to 'In-Progress'.
    // This avoids unique constraint errors.
    if (!attempt || ((attempt.status === 'Submitted' || attempt.status === 'Auto-Submitted' || attempt.status === 'Blocked') && exam.allow_multiple_attempts)) {
      if (!attempt) {
        // Create new attempt
        const { data: newAttempt, error: newAttemptError } = await supabaseAdmin.from('exam_attempts').insert([{
          exam_id: (await params).id,
          candidate_id: auth.id,
          status: 'In-Progress',
          start_time: new Date().toISOString(),
          time_remaining: exam.duration_seconds || (exam.duration_minutes * 60)
        }]).select().single();
        
        if (newAttemptError) throw newAttemptError;
        attempt = newAttempt;
      } else {
        // Update old attempt to restart it
        const { data: updatedAttempt, error: updateError } = await supabaseAdmin.from('exam_attempts').update({
          status: 'In-Progress',
          time_remaining: exam.duration_seconds || (exam.duration_minutes * 60),
          start_time: new Date().toISOString(),
          warnings: 0
        }).eq('id', attempt.id).select().single();
        
        if (updateError) throw updateError;
        attempt = updatedAttempt;
      }
    }

    // If it's already in-progress, cap the time_remaining to the current exam duration 
    // in case the examiner reduced the time while they were paused.
    if (attempt && attempt.status === 'In-Progress') {
      const maxTime = exam.duration_seconds || (exam.duration_minutes * 60);
      if (attempt.time_remaining > maxTime) {
        attempt.time_remaining = maxTime;
        await supabaseAdmin.from('exam_attempts').update({ time_remaining: maxTime }).eq('id', attempt.id);
      }
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
        timeRemaining: attempt.time_remaining,
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
