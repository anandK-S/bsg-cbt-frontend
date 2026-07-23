import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseClient';
import { camelCaseResponse } from '@/utils/apiResponse';
import { getUserFromRequest } from '@/utils/authServer';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    if (auth.profile?.role !== 'Examiner' && auth.profile?.role !== 'Admin') {
      return camelCaseResponse({ message: 'Forbidden' }, { status: 403 });
    }

    const resultId = (await params).id;

    // 1. Fetch current result to get current release status
    const { data: result, error: fetchError } = await supabaseAdmin
      .from('results')
      .select('is_released')
      .eq('id', resultId)
      .single();

    if (fetchError) throw fetchError;
    if (!result) return camelCaseResponse({ message: 'Result not found' }, { status: 404 });

    // 2. Toggle the is_released status
    const newReleaseStatus = !result.is_released;

    const { data: updatedResult, error: updateError } = await supabaseAdmin
      .from('results')
      .update({ is_released: newReleaseStatus })
      .eq('id', resultId)
      .select()
      .single();

    if (updateError) throw updateError;

    return camelCaseResponse({ 
      message: 'Result release status updated',
      result: updatedResult 
    });
  } catch (error: any) {
    console.error('Error toggling result release:', error);
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
