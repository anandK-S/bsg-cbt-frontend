import { NextRequest } from 'next/server';
import { supabase } from '@/utils/supabaseClient';
import { camelCaseResponse } from '@/utils/apiResponse';
import { getUserFromRequest } from '@/utils/authServer';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return camelCaseResponse({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        exam_id (
          id,
          title,
          duration_minutes,
          duration_seconds,
          issue_certificate,
          creator_id (
            name
          )
        ),
        attempt_id (
          time_remaining
        )
      `)
      .eq('candidate_id', auth.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedResults = results.map(r => ({
      _id: r.id,
      totalMarks: r.total_marks,
      score: r.score,
      createdAt: r.created_at,
      isReleased: r.is_released,
      violationReason: r.violation_reason,
      examId: {
        _id: r.exam_id,
        title: (r.exam_id as any)?.title,
        durationMinutes: (r.exam_id as any)?.duration_minutes,
        durationSeconds: (r.exam_id as any)?.duration_seconds,
        issueCertificate: (r.exam_id as any)?.issue_certificate,
        creatorId: {
          name: (r.exam_id as any)?.creator_id?.name || 'Unknown'
        }
      },
      attemptId: {
        timeRemaining: (r.attempt_id as any)?.time_remaining
      }
    }));

    return camelCaseResponse(formattedResults);
  } catch (error: any) {
    console.error('Error fetching past results:', error);
    return camelCaseResponse({ message: 'Server error' }, { status: 500 });
  }
}
