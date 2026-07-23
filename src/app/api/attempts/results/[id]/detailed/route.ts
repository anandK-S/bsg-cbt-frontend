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
      .select('*, exams(*), attempt_id')
      .eq('id', resultId)
      .single();

    if (resultError) throw resultError;
    if (!result) return camelCaseResponse({ message: 'Result not found' }, { status: 404 });

    // Verify ownership or examiner permissions
    if (result.candidate_id !== auth.id && auth.role === 'Candidate') {
      return camelCaseResponse({ message: 'Forbidden' }, { status: 403 });
    }

    if (!result.is_released && auth.role === 'Candidate') {
      return camelCaseResponse({ message: 'Results are pending' }, { status: 403 });
    }

    // 2. Fetch all questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', result.exam_id)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    // 3. Fetch candidate's answers
    const { data: answers, error: answersError } = await supabase
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', result.attempt_id);

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
        _id: result.exam_id,
        title: (result.exams as any)?.title,
        description: (result.exams as any)?.description,
        category: (result.exams as any)?.category
      }
    };

    return camelCaseResponse({ result: formattedResult, questionDetails });
  } catch (error: any) {
    console.error('Error in detailed result:', error);
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
