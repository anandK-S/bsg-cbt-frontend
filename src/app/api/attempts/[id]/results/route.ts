import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { camelCaseResponse } from '@/utils/apiResponse';
import { getUserFromRequest } from '@/utils/authServer';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    if (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Forbidden' }, { status: 403 });
    }

    const examId = (await params).id;

    const { error } = await supabaseAdmin
      .from('results')
      .delete()
      .eq('exam_id', examId);

    if (error) throw error;

    return camelCaseResponse({ message: 'All results cleared successfully' });
  } catch (error: any) {
    console.error('Error clearing results:', error);
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
