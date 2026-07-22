import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const attemptId = params.id;
    const body = await req.json();
    const { answers, timeRemaining, violationReason } = body;

    // Fetch attempt and exam
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('*, exam_id(*)')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.candidate_id !== auth.id) {
      return NextResponse.json({ message: 'Invalid attempt' }, { status: 400 });
    }

    if (attempt.status === 'Completed') {
      return NextResponse.json({ message: 'Attempt already completed' }, { status: 400 });
    }

    // Fetch questions to calculate score
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', attempt.exam_id.id);

    let score = 0;
    let totalMarks = 0;

    // Save answers
    if (answers && questions) {
      const answerInserts = [];
      for (const [qId, ans] of Object.entries(answers as Record<string, any>)) {
        const question = questions.find((q: any) => q.id === qId);
        if (!question) continue;

        totalMarks += question.marks || 1;

        if (ans.selectedOptionIndex === question.correct_option_index) {
          score += question.marks || 1;
        }

        answerInserts.push({
          attempt_id: attemptId,
          question_id: qId,
          selected_option_index: ans.selectedOptionIndex,
          status: ans.status || 'Answered',
          time_spent_seconds: ans.timeSpent || 0
        });
      }

      if (answerInserts.length > 0) {
        // We can ignore errors if answers are already saved, but upsert is better.
        // For simplicity, just insert.
        await supabase.from('attempt_answers').upsert(answerInserts, { onConflict: 'attempt_id,question_id' });
      }
    }

    const timeTaken = (attempt.exam_id.duration_minutes * 60 + (attempt.exam_id.duration_seconds || 0)) - (timeRemaining || 0);

    // Save Result
    const { data: result } = await supabase
      .from('results')
      .insert({
        attempt_id: attemptId,
        candidate_id: auth.id,
        exam_id: attempt.exam_id.id,
        score,
        total_marks: totalMarks,
        is_released: attempt.exam_id.release_results_instantly,
        time_taken_seconds: timeTaken > 0 ? timeTaken : 0,
        violation_reason: violationReason || null,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    // Update attempt
    await supabase
      .from('exam_attempts')
      .update({
        status: 'Completed',
        end_time: new Date().toISOString(),
        time_remaining: timeRemaining,
        violation_reason: violationReason || null
      })
      .eq('id', attemptId);

    return NextResponse.json({ message: 'Submitted', resultId: result?.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
