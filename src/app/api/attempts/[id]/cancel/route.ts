import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin')) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 403 });
    }

    const attemptId = (await params).id;

    // Update attempt
    const { error } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        status: 'Blocked',
        end_time: new Date().toISOString(),
        violation_reason: 'Exam forcefully terminated by Examiner'
      })
      .eq('id', attemptId);

    if (error) {
      throw error;
    }

    return camelCaseResponse({ message: 'Attempt cancelled successfully' });
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
