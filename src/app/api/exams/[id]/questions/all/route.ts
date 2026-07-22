import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await supabaseAdmin.from('questions').delete().eq('exam_id', (await params).id);
  return NextResponse.json({ message: "All questions deleted" });
}
