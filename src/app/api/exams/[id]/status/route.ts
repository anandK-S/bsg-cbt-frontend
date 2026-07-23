import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('exams').update({ status: body.status }).eq('id', (await params).id).select().single();
    if (error) throw error;
    return camelCaseResponse(data);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message }, { status: 500 });
  }
}
