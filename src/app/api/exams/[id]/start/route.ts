import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { testKey } = body;

    const { data: exam, error } = await supabase.from('exams').select('*').eq('id', (await params).id).single();
    if (error || !exam) throw new Error('Exam not found');

    if (exam.test_key && exam.test_key !== testKey) {
      return NextResponse.json({ message: 'Invalid test key' }, { status: 403 });
    }

    const { data: attempt, error: attemptError } = await supabaseAdmin.from('exam_attempts').insert([{
      exam_id: (await params).id,
      candidate_id: auth.id,
      status: 'In-Progress',
      time_remaining: (exam.duration_minutes * 60) + (exam.duration_seconds || 0)
    }]).select().single();

    if (attemptError) throw attemptError;

    // Fetch questions to send to frontend
    const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', (await params).id);
    
    // Map data for frontend
    const mappedQuestions = (questions || []).map(q => ({
      ...q,
      _id: q.id,
      correctOptionIndex: undefined, // Hide correct answer
      acceptableAnswers: undefined
    }));

    return NextResponse.json({
      attempt: { ...attempt, _id: attempt.id },
      questions: mappedQuestions
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
