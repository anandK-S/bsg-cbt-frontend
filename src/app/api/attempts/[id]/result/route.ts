import { camelCaseResponse } from '@/utils/apiResponse';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/utils/supabaseClient';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });

    const examId = (await params).id;

    if (auth.profile?.role === 'Examiner' || auth.profile?.role === 'Admin') {
      const { data: results, error } = await supabaseAdmin
        .from('results')
        .select('*, candidate_id(*)')
        .eq('exam_id', examId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedResults = results.map((r: any) => ({
        _id: r.id,
        score: r.score,
        totalMarks: r.total_marks,
        createdAt: r.created_at,
        isReleased: r.is_released,
        candidateId: {
          name: (r.candidate_id as any)?.name || 'Unknown',
          bsgId: (r.candidate_id as any)?.bsg_id || 'N/A'
        }
      }));
      return camelCaseResponse(formattedResults);
    }

    // Candidate view: return single result
    const { data: result, error } = await supabase
      .from('results')
      .select('*, exam_id(*), attempt_id(*)')
      .eq('exam_id', examId)
      .eq('candidate_id', auth.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!result) {
      return camelCaseResponse({ message: 'Result not found' }, { status: 404 });
    }

    if (!result.is_released) {
      return camelCaseResponse({ message: 'Results are pending' }, { status: 403 });
    }

    const formattedResult = {
      _id: result.id,
      score: result.score,
      totalMarks: result.total_marks,
      timeTaken: result.time_taken_seconds,
      examId: result.exam_id,
      aiFeedback: result.ai_feedback,
    };

    return camelCaseResponse(formattedResult);
  } catch (error: any) {
    return camelCaseResponse({ message: error.message || 'Server error' }, { status: 500 });
  }
}
