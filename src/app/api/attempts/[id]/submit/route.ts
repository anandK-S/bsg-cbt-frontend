import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { answers, timeRemaining, warnings, violationReason } = body;

    // Update attempt status
    await supabase.from('exam_attempts').update({
      status: 'Submitted',
      end_time: new Date().toISOString(),
      time_remaining: timeRemaining,
      warnings,
      violation_reason: violationReason
    }).eq('id', params.id);

    // Save answers (simplified for now to avoid massive inserts, real production would do batch insert)
    if (answers && answers.length > 0) {
      const answersToInsert = answers.map((a: any) => ({
        attempt_id: params.id,
        question_id: a.questionId,
        selected_option_index: a.selectedOptionIndex,
        status: a.status,
        time_spent_seconds: a.timeSpentSeconds
      }));
      await supabase.from('attempt_answers').insert(answersToInsert);
    }

    // In a full implementation, we'd calculate the score here.
    // For this stub, we just return success.
    return NextResponse.json({ message: 'Submitted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
