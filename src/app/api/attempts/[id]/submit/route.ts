import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const attemptId = (await params).id;
    const body = await req.json();
    const { answers, timeRemaining, violationReason } = body;

    // Fetch attempt and exam
    const { data: attempt } = await supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(*)')
      .eq('id', attemptId)
      .single();

    if (!attempt || attempt.candidate_id !== auth.id) {
      return camelCaseResponse({ message: 'Invalid attempt' }, { status: 400 });
    }

    if (attempt.status === 'Submitted' || attempt.status === 'Blocked' || attempt.status === 'Auto-Submitted') {
      return camelCaseResponse({ message: 'Attempt already processed' }, { status: 400 });
    }

    // Safely get exam object whether Supabase returns it as an array or object
    const examObj = Array.isArray(attempt.exams) ? attempt.exams[0] : attempt.exams;

    const e = attempt.exams as any;
    const maxTime = e?.duration_seconds || (e?.duration_minutes * 60) || 0;
    if (body.timeRemaining > maxTime) {
      return camelCaseResponse({ message: 'Invalid time remaining' }, { status: 400 });
    }

    // Fetch questions to calculate score
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', attempt.exam_id);

    let score = 0;
    let totalMarks = 0;

    // Save answers
    if (answers && questions) {
      const answerInserts = [];
      for (const ans of answers as any[]) {
        const qId = ans.questionId;
        const question = questions.find((q: any) => q.id === qId);
        if (!question) continue;

        totalMarks += question.marks || 1;

        // check if candidate marked as Answered and the choice is correct
        if (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== null) {
          if (ans.selectedOptionIndex === question.correct_option_index) {
            score += question.marks || 1;
          }
        }

        answerInserts.push({
          attempt_id: attemptId,
          question_id: qId,
          selected_option_index: ans.selectedOptionIndex !== undefined ? ans.selectedOptionIndex : null,
          status: ans.status || 'Answered',
          time_spent_seconds: ans.timeSpent || 0,
          viewed_language: ans.viewedLanguage || 'en'
        });
      }

      if (answerInserts.length > 0) {
        // We can ignore errors if answers are already saved, but upsert is better.
        // For simplicity, just insert.
        const { error: ansError } = await supabaseAdmin.from('attempt_answers').upsert(answerInserts, { onConflict: 'attempt_id,question_id' });
        if (ansError) throw new Error(`Answer save error: ${ansError.message}`);
      }
    }

    // Delete any old result for this attempt to prevent unique constraint errors during retakes
    await supabaseAdmin.from('results').delete().eq('attempt_id', attemptId);

    const timeTaken = (examObj?.duration_seconds || (examObj?.duration_minutes * 60) || 0) - (timeRemaining || 0);

    // Save Result
    const { data: result, error: resultError } = await supabaseAdmin
      .from('results')
      .insert({
        attempt_id: attemptId,
        candidate_id: auth.id,
        exam_id: attempt.exam_id,
        score,
        total_marks: totalMarks,
        is_released: examObj?.release_results_instantly ?? true,
        violation_reason: violationReason || null,
        time_taken_seconds: timeTaken
      })
      .select()
      .single();
    if (resultError) throw new Error(`Result save error: ${resultError.message}`);

    // Mark Attempt as Completed
    const { error: updateError } = await supabaseAdmin.from('exam_attempts').update({
      status: violationReason ? 'Blocked' : 'Submitted',
      end_time: new Date().toISOString(),
      time_remaining: timeRemaining,
      warnings: attempt.warnings || 0
    }).eq('id', attemptId);
    if (updateError) throw new Error(`Attempt update error: ${updateError.message}`);

    return camelCaseResponse({ message: 'Submitted', resultId: result?.id });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
