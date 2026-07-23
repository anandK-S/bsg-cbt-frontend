import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { data: attempt } = await supabaseAdmin.from('exam_attempts').select('exam_id, exams(duration_minutes, duration_seconds)').eq('id', (await params).id).single();
    
    let timeToSave = body.timeRemaining;
    let maxTime = null;

    if (attempt && attempt.exams) {
      maxTime = (attempt.exams as any).duration_seconds || ((attempt.exams as any).duration_minutes * 60);
      if (timeToSave > maxTime) {
        timeToSave = maxTime;
      }
    }

    await supabaseAdmin.from('exam_attempts').update({
      time_remaining: timeToSave
    }).eq('id', (await params).id);

    return camelCaseResponse({ success: true, cappedTime: timeToSave, maxTime });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
