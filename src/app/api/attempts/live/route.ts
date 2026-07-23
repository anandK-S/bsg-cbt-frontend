import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/utils/authServer';
import { supabaseAdmin } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    if (auth.profile?.role === 'Examiner' || auth.profile?.role === 'Admin') {
      // Return ALL live attempts
      const { data: attempts, error } = await supabaseAdmin
        .from('exam_attempts')
        .select('*, exams(*), profiles(name, bsg_id, district)')
        .in('status', ['In-Progress', 'Submitted', 'Auto-Submitted', 'Blocked'])
        .order('start_time', { ascending: false });

      if (error) throw error;

      // Map array for Examiner
      const formattedAttempts = attempts?.map(a => {
        const e = a.exams as any;
        const examMaxTime = (e?.duration_seconds || 0) || ((e?.duration_minutes || 0) * 60) || a.time_remaining;
        return {
        _id: a.id,
        candidateId: {
          _id: a.candidate_id,
          name: (a.profiles as any)?.name,
          bsgId: (a.profiles as any)?.bsg_id,
          district: (a.profiles as any)?.district,
        },
        examId: {
          _id: a.exam_id,
          title: (a.exams as any)?.title,
        },
        status: a.status,
        warnings: a.warnings || 0,
        updatedAt: a.updated_at || a.start_time,
        timeRemaining: Math.min(a.time_remaining, examMaxTime),
        examMaxTime: examMaxTime
      };
    }) || [];

      return camelCaseResponse(formattedAttempts);
    } else {
      // Candidate: return their own current live attempt
      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .select('*, exam_id(*)')
        .eq('candidate_id', auth.id)
        .eq('status', 'In-Progress')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!attempt) {
        return camelCaseResponse({ message: 'No live attempt found' }, { status: 404 });
      }

      // Fetch questions for this exam
      const { data: questions } = await supabase
        .from('questions')
        .select('id, text, options, type, media_url, text_hindi, options_hindi')
        .eq('exam_id', (attempt.exam_id as any)?.id || attempt.exam_id);

      // Fetch answers already submitted for this attempt
      const { data: answers } = await supabase
        .from('attempt_answers')
        .select('*')
        .eq('attempt_id', attempt.id);

      const formattedQuestions = questions?.map(q => {
        const ans = answers?.find(a => a.question_id === q.id);
        return {
          _id: q.id,
          text: q.text,
          options: q.options,
          type: q.type,
          mediaUrl: q.media_url,
          textHindi: q.text_hindi,
          optionsHindi: q.options_hindi,
          status: ans?.status || 'Not Visited',
          selectedOptionIndex: ans?.selected_option_index ?? null,
        };
      }) || [];

      const result = {
        _id: attempt.id,
        examId: attempt.exam_id,
        startTime: attempt.start_time,
        timeRemaining: attempt.time_remaining,
        questions: formattedQuestions
      };

      return camelCaseResponse(result);
    }
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
