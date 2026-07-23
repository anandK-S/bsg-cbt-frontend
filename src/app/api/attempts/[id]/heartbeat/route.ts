import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    await supabase.from('exam_attempts').update({
      time_remaining: body.timeRemaining
    }).eq('id', (await params).id);

    return camelCaseResponse({ success: true });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
