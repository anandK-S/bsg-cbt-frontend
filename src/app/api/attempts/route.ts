import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { examId } = body;

    if (!examId) return NextResponse.json({ message: 'examId is required' }, { status: 400 });

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('duration_minutes, duration_seconds')
      .eq('id', examId)
      .single();

    if (examError || !exam) return NextResponse.json({ message: 'Exam not found' }, { status: 404 });

    const timeRemaining = (exam.duration_minutes * 60) + (exam.duration_seconds || 0);

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .insert({
        candidate_id: auth.id,
        exam_id: examId,
        status: 'In-Progress',
        time_remaining: timeRemaining,
        start_time: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    return NextResponse.json({ _id: attempt.id, ...attempt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
