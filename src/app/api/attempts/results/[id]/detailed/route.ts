import { NextRequest } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { camelCaseResponse } from '@/utils/apiResponse';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const resultId = (await params).id;

    // 1. Fetch the result
    const { data: result, error: resultError } = await supabase
      .from('results')
      .select(`
        *,
        exam_id (
          id,
          title,
          description,
          category
        ),
        attempt_id (
          id
        )
      `)
      .eq('id', resultId)
      .single();

    if (resultError) throw resultError;
    if (!result) return camelCaseResponse({ message: 'Result not found' }, { status: 404 });

    // Verify ownership or examiner permissions
    if (result.candidate_id !== auth.id && auth.profile?.role === 'Candidate') {
      return camelCaseResponse({ message: 'Forbidden' }, { status: 403 });
    }

    if (!result.is_released && auth.profile?.role === 'Candidate') {
      return camelCaseResponse({ message: 'Results are pending' }, { status: 403 });
    }

    const attemptObj = Array.isArray(result.attempt_id) ? result.attempt_id[0] : result.attempt_id;
    const attemptUuid = attemptObj?.id || result.attempt_id;

    // 2. Fetch all questions for this exam
    const examObj = Array.isArray(result.exam_id) ? result.exam_id[0] : result.exam_id;
    const examUuid = examObj?.id || result.exam_id;

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examUuid)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    // 3. Fetch candidate's answers
    const { data: answers, error: answersError } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptUuid);

    if (answersError) throw answersError;

    // 4. Map questions to frontend format with answers
    const questionDetails = questions.map((q: any) => {
      const candidateAns = answers.find(a => a.question_id === q.id);
      const isCorrect = candidateAns ? (candidateAns.selected_option_index === q.correct_option_index) : false;
      
      return {
        _id: q.id,
        text: q.text,
        textHindi: q.text_hindi,
        options: q.options,
        optionsHindi: q.options_hindi,
        correctOptionIndex: q.correct_option_index,
        marks: q.marks,
        mediaUrl: q.media_url,
        viewedLanguage: candidateAns?.viewed_language || 'en',
        candidateAnswerIndex: candidateAns ? candidateAns.selected_option_index : null,
        isCorrect: isCorrect
      };
    });

    const formattedResult = {
      _id: result.id,
      score: result.score,
      totalMarks: result.total_marks,
      timeTaken: result.time_taken_seconds,
      endTime: result.created_at,
      examId: {
        _id: examUuid,
        title: examObj?.title,
        description: examObj?.description,
        category: examObj?.category
      }
    };

    return camelCaseResponse({ result: formattedResult, questionDetails });
  } catch (error: any) {
    console.error('Error in detailed result:', error);
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
