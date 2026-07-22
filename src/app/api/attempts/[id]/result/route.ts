import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const examId = params.id;

    // The frontend expects the result for the specific exam for the logged-in user
    const { data: result, error } = await supabase
      .from('results')
      .select('*, exam_id(*), attempt_id(*)')
      .eq('exam_id', examId)
      .eq('candidate_id', auth.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!result) {
      return NextResponse.json({ message: 'Result not found' }, { status: 404 });
    }

    if (!result.is_released) {
      return NextResponse.json({ message: 'Results are pending' }, { status: 403 });
    }

    const formattedResult = {
      _id: result.id,
      score: result.score,
      totalMarks: result.total_marks,
      timeTaken: result.time_taken_seconds,
      examId: result.exam_id,
      aiFeedback: result.ai_feedback,
    };

    return NextResponse.json(formattedResult);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
