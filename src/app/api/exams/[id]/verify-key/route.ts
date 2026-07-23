import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { testKey } = body;

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .select('test_key')
      .eq('id', id)
      .single();

    if (error || !exam) {
      return camelCaseResponse({ message: 'Exam not found' }, { status: 404 });
    }

    if (exam.test_key && exam.test_key !== testKey) {
      return camelCaseResponse({ message: 'Invalid test key / password' }, { status: 403 });
    }

    return camelCaseResponse({ success: true });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
