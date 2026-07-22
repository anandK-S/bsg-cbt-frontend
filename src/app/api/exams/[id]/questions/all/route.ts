import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await supabase.from('questions').delete().eq('exam_id', params.id);
  return NextResponse.json({ message: "All questions deleted" });
}
