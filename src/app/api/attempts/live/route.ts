import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .select('*, exam_id(*)')
      .eq('candidate_id', auth.id)
      .eq('status', 'In-Progress')
      .order('created_at', { ascending: false })
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
      .eq('exam_id', attempt.exam_id);

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
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
